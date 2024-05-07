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
    validateOrderTotal,
    validateServiceForms,
    validateTimeslotId
} from './addOrderValidations.js';
import {doInsertOrder} from './doInsertOrder.js';
import {ErrorResponse, OrderCreatedResponse, PricedCreateOrderRequest} from '@breezbook/backend-api-types';
import {prismaClient} from '../prisma/client.js';
import {Mutations} from '../mutation/mutations.js';

export const addOrderErrorCodes = {
    customerFormMissing: 'addOrder.customer.form.missing',
    customerFormInvalid: 'addOrder.customer.form.invalid',
    serviceFormMissing: 'addOrder.service.form.missing',
    serviceFormInvalid: 'addOrder.service.form.invalid',
    noAvailability: 'addOrder.no.availability',
    noSuchCoupon: 'addOrder.no.such.coupon',
    expiredCoupon: 'addOrder.expired.coupon',
    wrongTotalPrice: 'addOrder.wrong.total.price',
    noSuchTimeslotId: 'addOrder.no.such.timeslot.id',
    incorrectDiscountAmount: 'addOrder.incorrect.discount.amount'
};

function withValidationsPerformed<T>(everythingForTenant: EverythingForAvailability, pricedCreateOrderRequest: PricedCreateOrderRequest, fn: () => T): ErrorResponse | T {
    const validationFns = [
        () => validateTimeslotId(everythingForTenant, pricedCreateOrderRequest),
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
        const everythingForTenant = await getEverythingForAvailability(prisma, tenantEnvironment, fromDate, toDate);
        let maybeExistingCustomer = await prisma.customers.findUnique({
            where: {
                tenant_id_environment_id_email: {
                    tenant_id: tenantEnvironment.tenantId.value,
                    environment_id: tenantEnvironment.environmentId.value,
                    email: createOrderRequest.customer.email.value
                }
            }
        });
        if (maybeExistingCustomer) {
            createOrderRequest.customer.id = customerId(maybeExistingCustomer.id);
        }
        const outcome = withValidationsPerformed(everythingForTenant, createOrderRequest, () => {
            return doAddOrder(everythingForTenant, createOrderRequest);
        });
        if (outcome._type === 'error.response') {
            return handleOutcome(res, prisma, tenantEnvironment, outcome);
        }
        const {mutations, orderCreatedResponse} = outcome;
        await handleOutcome(res, prisma, tenantEnvironment, mutations, httpJsonResponse(200, orderCreatedResponse));
    });
}
