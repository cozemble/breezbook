import * as express from 'express';
import {customerId, isoDateFns, TenantEnvironment} from '@breezbook/packages-core';
import {EverythingForAvailability, getEverythingForAvailability} from './getEverythingForAvailability.js';
import {
    validateAvailability,
    validateCoupon,
    validateCustomerForm,
    validateOpeningHours,
    validateOrderTotal,
    validateServiceDates,
    validateServiceForms,
} from './addOrderValidations.js';
import {doInsertOrder} from './doInsertOrder.js';
import {ErrorResponse, OrderCreatedResponse, PricedCreateOrderRequest} from '@breezbook/backend-api-types';
import {Mutations} from '../mutation/mutations.js';
import {announceChangesToAirtable} from "../inngest/announceChangesToAirtable.js";
import {
    asHandler,
    bodyAsJsonParam,
    EndpointDependencies,
    EndpointOutcome,
    expressBridge,
    httpResponseOutcome,
    mutationOutcome,
    ParamExtractor,
    productionDeps,
    sendEventOutcome,
    tenantEnvironmentParam
} from "../infra/endpoint.js";
import {RequestContext} from "../infra/http/expressHttp4t.js";
import {responseOf} from "@http4t/core/responses.js";

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

function pricedCreateOrderRequest(): ParamExtractor<PricedCreateOrderRequest> {
    return bodyAsJsonParam<PricedCreateOrderRequest>('priced.create.order.request');
}

export async function onAddOrderExpress(req: express.Request, res: express.Response): Promise<void> {
    return expressBridge(productionDeps, addOrderEndpoint, req, res);
}

export async function addOrderEndpoint(deps: EndpointDependencies, request: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, request).withTwoRequestParams(tenantEnvironmentParam(), pricedCreateOrderRequest(), handleAddOrder);
}

async function handleAddOrder(deps: EndpointDependencies, tenantEnvironment: TenantEnvironment, orderRequest: PricedCreateOrderRequest): Promise<EndpointOutcome[]> {
    const {fromDate, toDate} = isoDateFns.getDateRange(orderRequest.basket.lines.map((l) => l.date));
    const prisma = deps.prisma
    const everythingForAvailability = await getEverythingForAvailability(prisma, tenantEnvironment, fromDate, toDate);
    const maybeExistingCustomer = await prisma.customers.findFirst({
        where: {
            OR: [
                {
                    tenant_id: tenantEnvironment.tenantId.value,
                    environment_id: tenantEnvironment.environmentId.value,
                    email: orderRequest.customer.email.value
                },
                {

                    tenant_id: tenantEnvironment.tenantId.value,
                    environment_id: tenantEnvironment.environmentId.value,
                    phone_e164: orderRequest.customer.phone.value
                }
            ]
        }
    });
    if (maybeExistingCustomer) {
        orderRequest.customer.id = customerId(maybeExistingCustomer.id);
    }
    const outcome = withValidationsPerformed(everythingForAvailability, orderRequest, () => {
        return doAddOrder(everythingForAvailability, orderRequest);
    });
    if (outcome._type === 'error.response') {
        return [httpResponseOutcome(responseOf(400, JSON.stringify(outcome)))]
    }
    const {mutations, orderCreatedResponse} = outcome;
    return [
        mutationOutcome(tenantEnvironment, mutations),
        sendEventOutcome({
            name: announceChangesToAirtable.deferredChangeAnnouncement,
            data: {tenantId: tenantEnvironment.tenantId.value, environmentId: tenantEnvironment.environmentId.value}
        }),
        httpResponseOutcome(responseOf(200, JSON.stringify(orderCreatedResponse)))
    ];
}
