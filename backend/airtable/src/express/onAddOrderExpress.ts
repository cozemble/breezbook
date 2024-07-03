import * as express from 'express';
import {
    AddOn,
    addOnFns,
    AddOnOrder,
    Coupon,
    Customer,
    customerId,
    PaymentIntent,
    Price,
    priceFns,
    Service,
    serviceFns,
} from '@breezbook/packages-core';
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
import {
    ErrorResponse,
    OrderCreatedResponse,
    PricedCreateOrderRequest, ResourceRequirementSpec,
    ResourceRequirementOverride, specificResourceSpec,
    unpricedBasket,
    UnpricedBasket,
    UnpricedBasketLine,
    unpricedBasketLine
} from '@breezbook/backend-api-types';
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
import { responseOf } from '@breezbook/packages-http/dist/responses.js';
import {
    byId,
    IsoDate, isoDateFns,
    LocationId,
    resourceId,
    TenantEnvironment,
    TwentyFourHourClockTime
} from "@breezbook/packages-types";
import {resourcing} from "@breezbook/packages-resourcing";
import Resource = resourcing.Resource;
import ResourceRequirement = resourcing.ResourceRequirement;
import specificResource = resourcing.specificResource;

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

function withValidationsPerformed<T>(everythingForTenant: EverythingForAvailability, everythingToCreateOrder: EverythingToCreateOrder, fn: () => T): ErrorResponse | T {
    const validationFns = [
        () => validateServiceDates(everythingForTenant, everythingToCreateOrder),
        () => validateOpeningHours(everythingForTenant, everythingToCreateOrder),
        // () => validateTimeslotId(everythingForTenant, everythingToCreateOrder),
        () => validateCustomerForm(everythingForTenant, everythingToCreateOrder),
        () => validateServiceForms(everythingForTenant, everythingToCreateOrder),
        () => validateAvailability(everythingForTenant, everythingToCreateOrder),
        () => validateCoupon(everythingForTenant, everythingToCreateOrder),
        () => validateOrderTotal(everythingForTenant, everythingToCreateOrder)
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
    everythingForAvailability: EverythingForAvailability,
    everythingToCreateOrder: EverythingToCreateOrder
):
    | ErrorResponse
    | {
    _type: 'success';
    mutations: Mutations;
    orderCreatedResponse: OrderCreatedResponse;
} {
    return withValidationsPerformed(everythingForAvailability, everythingToCreateOrder, () => {
        return doInsertOrder(
            everythingForAvailability.tenantEnvironment,
            everythingToCreateOrder,
            everythingForAvailability.businessConfiguration.services,
            everythingForAvailability.tenantSettings
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

export interface HydratedAddOn {
    addOn: AddOn;
    quantity: number;
    price: Price;
}

export interface HydratedBasketLine {
    service: Service;
    locationId: LocationId;
    addOns: HydratedAddOn[];
    servicePrice: Price;
    total: Price;
    date: IsoDate;
    startTime: TwentyFourHourClockTime;
    serviceFormData: unknown[];
}

export interface HydratedBasket {
    _type: 'hydrated.basket';
    lines: HydratedBasketLine[];
    coupon?: Coupon;
    discount?: Price;
    total: Price;
}

export function hydratedBasket(lines: HydratedBasketLine[], coupon?: Coupon, discount?: Price, total?:Price): HydratedBasket {
    const actualTotal = total ?? priceFns.sum(lines.map((l) => l.total));
    return {
        _type: 'hydrated.basket',
        lines,
        coupon,
        discount,
        total: actualTotal
    };
}

export function hydratedBasketLine(service: Service, locationId: LocationId, addOns: HydratedAddOn[], servicePrice: Price, total: Price, date: IsoDate, startTime: TwentyFourHourClockTime, serviceFormData: unknown[]): HydratedBasketLine {
    return {
        service,
        locationId,
        addOns,
        servicePrice,
        total,
        date,
        startTime,
        serviceFormData
    };
}

export interface EverythingToCreateOrder {
    _type: 'everything.to.create.order';
    basket: HydratedBasket;
    customer: Customer;
    paymentIntent: PaymentIntent;
}

export function everythingToCreateOrder(basket: HydratedBasket, customer: Customer, paymentIntent: PaymentIntent): EverythingToCreateOrder {
    return {
        _type: 'everything.to.create.order',
        basket,
        customer,
        paymentIntent
    };
}

export const hydratedBasketFns = {

    toUnpricedBasket(basket: HydratedBasket): UnpricedBasket {
        return unpricedBasket(basket.lines.map((line) => hydratedBasketFns.toUnpricedBasketLine(line)), basket.coupon?.code)
    },

    toUnpricedBasketLine(line: HydratedBasketLine): UnpricedBasketLine {
        return unpricedBasketLine(line.service.id, line.locationId, line.addOns.map((a) => hydratedBasketFns.toAddOnOrder(a)), line.date, line.startTime, line.serviceFormData, [])
    },

    toAddOnOrder(addOn: HydratedAddOn): AddOnOrder {
        return {
            addOnId: addOn.addOn.id,
            quantity: addOn.quantity,
        };
    }
}

function maybeOverride(r: ResourceRequirement, resources: Resource[], resourceRequirementOverrides: ResourceRequirementOverride[]): ResourceRequirement {
    const override = resourceRequirementOverrides.find(o => o.requirementId === r.id.value);
    if (override) {
        return specificResource(byId.find(resources, resourceId(override.resourceId)), r.id)
    }

    return r;
}

function replaceRequirements(service: Service, resources: Resource[], resourceRequirementOverrides: ResourceRequirementOverride[]): Service {
    return {
        ...service,
        resourceRequirements: service.resourceRequirements.map(r => maybeOverride(r, resources, resourceRequirementOverrides))
    };
}

export interface EverythingToCreateOrderReferenceData {
    services: Service[];
    resources: Resource[];
    addOns: AddOn[];
    coupons: Coupon[];
}

export function makeEverythingToCreateOrder(everything: EverythingToCreateOrderReferenceData, orderRequest: PricedCreateOrderRequest): EverythingToCreateOrder {
    return {
        _type: 'everything.to.create.order',
        basket: {
            _type: 'hydrated.basket',
            lines: orderRequest.basket.lines.map((line) => {
                const service = replaceRequirements(serviceFns.findService(everything.services, line.serviceId), everything.resources, line.resourceRequirementOverrides);
                return {
                    service,
                    locationId: line.locationId,
                    addOns: line.addOnIds.map((a) => {
                        const addOn = addOnFns.findById(everything.addOns, a.addOnId);
                        return {
                            addOn,
                            quantity: a.quantity,
                            price: a.price
                        };
                    }),
                    servicePrice: line.servicePrice,
                    total: line.total,
                    date: line.date,
                    startTime: line.startTime,
                    serviceFormData: line.serviceFormData,
                };
            }),
            coupon: orderRequest.basket.couponCode ? everything.coupons.find((c) => c.code.value === orderRequest.basket?.couponCode?.value) : undefined,
            discount: orderRequest.basket.discount,
            total: orderRequest.basket.total
        },
        customer: orderRequest.customer,
        paymentIntent: orderRequest.paymentIntent
    };
}

function toReferenceData(everythingForAvailability: EverythingForAvailability):EverythingToCreateOrderReferenceData {
    return {
        services: everythingForAvailability.businessConfiguration.services,
        resources: everythingForAvailability.businessConfiguration.resources,
        addOns: everythingForAvailability.businessConfiguration.addOns,
        coupons: everythingForAvailability.coupons
    }
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
    const everythingToCreateOrder = makeEverythingToCreateOrder(toReferenceData(everythingForAvailability), orderRequest);
    const outcome = withValidationsPerformed(everythingForAvailability, everythingToCreateOrder, () => {
        return doAddOrder(everythingForAvailability, everythingToCreateOrder);
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
