import * as express from 'express';
import {
    AddOn,
    addOnFns,
    AddOnOrder,
    Coupon,
    Customer,
    customerId,
    PaymentIntent,
    price,
    Price,
    priceFns,
    Service,
    serviceFns,
    ServiceOption,
    serviceOptionFns,
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
    PricedCreateOrderRequest,
    ResourceRequirementOverride,
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
import {responseOf} from '@breezbook/packages-http/dist/responses.js';
import {
    addOnId,
    byId,
    Capacity, Duration,
    IsoDate,
    isoDateFns,
    LocationId,
    resourceId,
    serviceOptionId,
    serviceOptionRequest,
    ServiceOptionRequest,
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

export interface HydratedServiceOption {
    option: ServiceOption;
    quantity: number;
    price: Price;
}

export interface HydratedBasketLine {
    service: Service;
    capacity: Capacity
    locationId: LocationId;
    addOns: HydratedAddOn[];
    options: HydratedServiceOption[];
    servicePrice: Price;
    total: Price;
    date: IsoDate;
    startTime: TwentyFourHourClockTime;
    duration: Duration
    serviceFormData: unknown[];
    resourceRequirementOverrides: ResourceRequirementOverride[]
}

export interface HydratedBasket {
    _type: 'hydrated.basket';
    lines: HydratedBasketLine[];
    coupon?: Coupon;
    discount?: Price;
    total: Price;
}

export function hydratedBasket(lines: HydratedBasketLine[], coupon?: Coupon, discount?: Price, total?: Price): HydratedBasket {
    const actualTotal = total ?? priceFns.sum(lines.map((l) => l.total));
    return {
        _type: 'hydrated.basket',
        lines,
        coupon,
        discount,
        total: actualTotal
    };
}

export function hydratedBasketLine(service: Service, locationId: LocationId, capacity: Capacity, options: HydratedServiceOption[], addOns: HydratedAddOn[], servicePrice: Price, total: Price, date: IsoDate, startTime: TwentyFourHourClockTime, duration: Duration,serviceFormData: unknown[], resourceRequirementOverrides: ResourceRequirementOverride[]): HydratedBasketLine {
    return {
        service,
        locationId,
        options,
        capacity,
        addOns,
        servicePrice,
        total,
        date,
        startTime,
        duration,
        serviceFormData,
        resourceRequirementOverrides
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
        return unpricedBasketLine(line.service.id, line.locationId, line.addOns.map((a) => hydratedBasketFns.toAddOnOrder(a)), line.date, line.startTime, line.duration,line.serviceFormData, line.resourceRequirementOverrides, line.options.map((o) => hydratedBasketFns.toServiceOptionRequest(o)));
    },

    toAddOnOrder(addOn: HydratedAddOn): AddOnOrder {
        return {
            addOnId: addOn.addOn.id,
            quantity: addOn.quantity,
        };
    },
    toServiceOptionRequest(o: HydratedServiceOption): ServiceOptionRequest {
        return serviceOptionRequest(o.option.id, o.quantity);
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
    options: ServiceOption[]
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
                    duration: line.duration,
                    locationId: line.locationId,
                    capacity: line.capacity,
                    addOns: line.priceBreakdown.pricedAddOns.map((a) => {
                        const addOn = addOnFns.findById(everything.addOns, addOnId(a.addOnId));
                        return {
                            addOn,
                            quantity: a.quantity,
                            price: price(a.price, service.price.currency)
                        };
                    }),
                    options: line.priceBreakdown.pricedOptions.map((o) => {
                        const option = serviceOptionFns.findServiceOption(everything.options, serviceOptionId(o.serviceOptionId));
                        return {
                            option,
                            quantity: o.quantity,
                            price: price(o.price, service.price.currency)
                        };
                    }),
                    servicePrice: price(line.priceBreakdown.servicePrice, service.price.currency),
                    total: price(line.priceBreakdown.total, service.price.currency),
                    date: line.date,
                    startTime: line.startTime,
                    serviceFormData: line.serviceFormData,
                    resourceRequirementOverrides: line.resourceRequirementOverrides
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

export function toReferenceData(everythingForAvailability: EverythingForAvailability): EverythingToCreateOrderReferenceData {
    return {
        services: everythingForAvailability.businessConfiguration.services,
        resources: everythingForAvailability.businessConfiguration.resources,
        addOns: everythingForAvailability.businessConfiguration.addOns,
        coupons: everythingForAvailability.coupons,
        options: everythingForAvailability.businessConfiguration.serviceOptions
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
        return [httpResponseOutcome(responseOf(400, JSON.stringify(outcome), ['Content-Type', 'application/json']))]
    }
    const {mutations, orderCreatedResponse} = outcome;
    return [
        mutationOutcome(tenantEnvironment, mutations),
        sendEventOutcome({
            name: announceChangesToAirtable.deferredChangeAnnouncement,
            data: {tenantId: tenantEnvironment.tenantId.value, environmentId: tenantEnvironment.environmentId.value}
        }),
        httpResponseOutcome(responseOf(200, JSON.stringify(orderCreatedResponse), ['Content-Type', 'application/json']))
    ];
}
