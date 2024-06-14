import * as express from 'express';
import {
    handleOutcome,
    httpJsonResponse,
    pricedCreateOrderRequest,
    tenantEnvironmentParam,
    withTwoRequestParams
} from '../infra/functionalExpress.js';
import {customerId, isoDateFns} from '@breezbook/packages-core';
import {EverythingForAvailability, getEverythingForAvailability} from './getEverythingForAvailability.js';
import {
    validateAvailability,
    validateCoupon,
    validateCustomerForm,
    validateOpeningHours,
    validateOrderTotal, validateServiceDates,
    validateServiceForms,
} from './addOrderValidations.js';
import {doInsertOrder} from './doInsertOrder.js';
import {ErrorResponse, OrderCreatedResponse, PricedCreateOrderRequest} from '@breezbook/backend-api-types';
import {prismaClient} from '../prisma/client.js';
import {Mutations} from '../mutation/mutations.js';
import {announceChangesToAirtable} from "../inngest/announceChangesToAirtable.js";
import {inngest} from "../inngest/client.js";

export const addOrderErrorCodes = {
    customerFormMissing: 'addOrder.customer.form.missing',
    customerFormInvalid: 'addOrder.customer.form.invalid',
    serviceFormMissing: 'addOrder.service.form.missing',
    serviceFormInvalid: 'addOrder.service.form.invalid',
    businessIsNotOpenAtThatTime: 'addOrder.business.is.not.open.at.that.time',
    noAvailability: 'addOrder.no.availability',
    noSuchCoupon: 'addOrder.no.such.coupon',
    expiredCoupon: 'addOrder.expired.coupon',
    wrongTotalPrice: 'addOrder.wrong.total.price',
    noSuchTimeslotId: 'addOrder.no.such.timeslot.id',
    incorrectDiscountAmount: 'addOrder.incorrect.discount.amount',
    serviceDateInThePast: 'addOrder.service.date.in.the.past',
};

function withValidationsPerformed<T>(everythingForTenant: EverythingForAvailability, pricedCreateOrderRequest: PricedCreateOrderRequest, fn: () => T): ErrorResponse | T {
    const validationFns = [
        () => validateServiceDates(everythingForTenant, pricedCreateOrderRequest),
        () => validateOpeningHours(everythingForTenant, pricedCreateOrderRequest),
        // () => validateTimeslotId(everythingForTenant, pricedCreateOrderRequest),
        () => validateCustomerForm(everythingForTenant, pricedCreateOrderRequest),
        () => validateServiceForms(everythingForTenant, pricedCreateOrderRequest),
        () => validateAvailability(everythingForTenant, pricedCreateOrderRequest),
        () => validateCoupon(everythingForTenant, pricedCreateOrderRequest),
        () => validateOrderTotal(everythingForTenant, pricedCreateOrderRequest)
    ];

    for (const validationFn of validationFns) {
        const validationError = validationFn();
        if (validationError) {
            return validationError;
        }
    }

    return fn();
}

export function doAddOrder(
    everythingForTenant: EverythingForAvailability,
    pricedCreateOrderRequest: PricedCreateOrderRequest
):
    | ErrorResponse
    | {
    _type: 'success';
    mutations: Mutations;
    orderCreatedResponse: OrderCreatedResponse;
} {
    return withValidationsPerformed(everythingForTenant, pricedCreateOrderRequest, () => {
        return doInsertOrder(
            everythingForTenant.tenantEnvironment,
            pricedCreateOrderRequest,
            everythingForTenant.businessConfiguration.services,
            everythingForTenant.tenantSettings
        );
    });
}

export async function addOrder(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, tenantEnvironmentParam(), pricedCreateOrderRequest(), async (tenantEnvironment, createOrderRequest) => {
        const {fromDate, toDate} = isoDateFns.getDateRange(createOrderRequest.basket.lines.map((l) => l.date));
        const prisma = prismaClient();
        const everythingForAvailability = await getEverythingForAvailability(prisma, tenantEnvironment, fromDate, toDate);
        const maybeExistingCustomer = await prisma.customers.findFirst({
            where: {
                OR: [
                    {
                        tenant_id: tenantEnvironment.tenantId.value,
                        environment_id: tenantEnvironment.environmentId.value,
                        email: createOrderRequest.customer.email.value
                    },
                    {

                        tenant_id: tenantEnvironment.tenantId.value,
                        environment_id: tenantEnvironment.environmentId.value,
                        phone_e164: createOrderRequest.customer.phone.value
                    }
                ]
            }
        });
        if (maybeExistingCustomer) {
            createOrderRequest.customer.id = customerId(maybeExistingCustomer.id);
        }
        const outcome = withValidationsPerformed(everythingForAvailability, createOrderRequest, () => {
            return doAddOrder(everythingForAvailability, createOrderRequest);
        });
        if (outcome._type === 'error.response') {
            return handleOutcome(res, prisma, tenantEnvironment, outcome);
        }
        const {mutations, orderCreatedResponse} = outcome;
        try {
            await inngest.send({
                name: announceChangesToAirtable.deferredChangeAnnouncement,
                data: {tenantId: tenantEnvironment.tenantId.value, environmentId: tenantEnvironment.environmentId.value}
            });
        } catch (e: any) {
            console.info(`While sending ${announceChangesToAirtable.deferredChangeAnnouncement} to Inngest: ${e.message}`)
        }
        await handleOutcome(res, prisma, tenantEnvironment, mutations, httpJsonResponse(200, orderCreatedResponse));
    });
}
