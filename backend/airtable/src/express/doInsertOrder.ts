import {
    Customer,
    FormId,
    orderId,
    PaymentIntent,
    ResourceRequirement,
    Service,
    TenantEnvironment,
    TenantSettings,
    timePeriodFns
} from '@breezbook/packages-core';
import {orderCreatedResponse, OrderCreatedResponse} from '@breezbook/backend-api-types';
import {v4 as uuidv4} from 'uuid';
import {Prisma} from '@prisma/client';
import {
    createBooking,
    createBookingResourceRequirement,
    CreateBookingResourceRequirement,
    createOrder,
    CreateOrder,
    createOrderLine,
    createReservation,
    upsertBookingServiceFormValues,
    UpsertBookingServiceFormValues,
    upsertCustomer,
    upsertCustomerFormValues
} from '../prisma/breezPrismaMutations.js';
import {Mutation, Mutations, mutations as mutationsConstructor} from '../mutation/mutations.js';
import {DbPaymentMethod} from "../prisma/dbtypes.js";
import {EverythingToCreateOrder, HydratedBasketLine} from "./onAddOrderExpress.js";

function upsertCustomerAsMutations(tenantEnvironment: TenantEnvironment, customer: Customer, tenantSettings: TenantSettings): Mutation[] {
    const tenant_id = tenantEnvironment.tenantId.value;
    const environment_id = tenantEnvironment.environmentId.value;
    const email = customer.email.value;
    const upserts: Mutation[] = [
        upsertCustomer(
            {
                id: customer.id.value,
                email,
                phone_e164: customer.phone.value,
                first_name: customer.firstName,
                last_name: customer.lastName,
                environment_id,
                tenant_id
            }
        )
    ];
    if (tenantSettings.customerFormId && customer.formData) {
        const create: Prisma.customer_form_valuesCreateArgs['data'] = {
            environment_id: tenantEnvironment.environmentId.value,
            tenant_id: tenantEnvironment.tenantId.value,
            form_values: customer.formData,
            customer_id: customer.id.value
        };
        const update: Prisma.customer_form_valuesUpdateArgs['data'] = {
            form_values: customer.formData
        };
        const where: Prisma.customer_form_valuesWhereUniqueInput = {
            tenant_id_environment_id_customer_id: {tenant_id, environment_id, customer_id: customer.id.value}
        };

        upserts.push(upsertCustomerFormValues(create, update, where));
    }
    return upserts;
}

function toDbPaymentMethod(paymentIntent: PaymentIntent): DbPaymentMethod {
    switch (paymentIntent._type) {
        case 'full.payment.on.checkout':
            return 'upfront';
        case 'deposit.and.balance':
            return 'deposit_and_balance_on_delivery';
        case 'payment.on.service.delivery':
            return 'on_delivery';
    }
}

function createOrderAsPrismaMutation(tenantEnvironment: TenantEnvironment, everythingToCreateOrder: EverythingToCreateOrder, orderId: string): CreateOrder {
    const tenant_id = tenantEnvironment.tenantId.value;
    const environment_id = tenantEnvironment.environmentId.value;
    return createOrder({
        id: orderId,
        environment_id,
        total_price_in_minor_units: everythingToCreateOrder.basket.total.amount.value,
        total_price_currency: everythingToCreateOrder.basket.total.currency.value,
        customer_id: everythingToCreateOrder.customer.id.value,
        tenant_id,
        payment_method: toDbPaymentMethod(everythingToCreateOrder.paymentIntent),
    });
}

function upsertServiceFormValues(
    tenantEnvironment: TenantEnvironment,
    serviceFormId: FormId,
    serviceFormData: unknown,
    bookingId: string
): UpsertBookingServiceFormValues {
    const create: Prisma.booking_service_form_valuesCreateArgs['data'] = {
        environment_id: tenantEnvironment.environmentId.value,
        booking_id: bookingId,
        tenant_id: tenantEnvironment.tenantId.value,
        service_form_id: serviceFormId.value,
        service_form_values: serviceFormData as any
    };
    const update: Prisma.booking_service_form_valuesUpdateArgs['data'] = {
        service_form_values: serviceFormData as any
    };
    const where: Prisma.booking_service_form_valuesWhereUniqueInput = {
        tenant_id_environment_id_booking_id_service_form_id: {
            tenant_id: tenantEnvironment.tenantId.value,
            environment_id: tenantEnvironment.environmentId.value,
            service_form_id: serviceFormId.value,
            booking_id: bookingId
        }
    };
    return upsertBookingServiceFormValues(create, update, where);
}

function toBookingResourceRequirementCreate(tenantEnvironment: TenantEnvironment, requirement: ResourceRequirement, bookingId: string): CreateBookingResourceRequirement {
    if (requirement._type === "specific.resource") {
        return createBookingResourceRequirement({
            id: requirement.id.value,
            tenant_id: tenantEnvironment.tenantId.value,
            environment_id: tenantEnvironment.environmentId.value,
            booking_id: bookingId,
            resource_id: requirement.resource.id.value,
            requirement_type: 'specific_resource'
        })
    } else {
        return createBookingResourceRequirement({
            id: requirement.id.value,
            tenant_id: tenantEnvironment.tenantId.value,
            environment_id: tenantEnvironment.environmentId.value,
            booking_id: bookingId,
            requirement_type: 'any_suitable',
            resource_type: requirement.requirement.value
        })
    }
}

function processOrderLines(
    tenantEnvironment: TenantEnvironment,
    paymentIntent: PaymentIntent,
    customer: Customer,
    lines: HydratedBasketLine[],
    orderId: string
): { mutations: Mutation[]; bookingIds: string[]; reservationIds: string[]; orderLineIds: string[] } {
    const tenant_id = tenantEnvironment.tenantId.value;
    const environment_id = tenantEnvironment.environmentId.value;

    const mutations: Mutation[] = [];
    const shouldMakeReservations =
        paymentIntent._type === 'full.payment.on.checkout' || paymentIntent._type === 'deposit.and.balance';
    const orderLineIds = [] as string[];
    const reservationIds = [] as string[];
    const bookingIds = [] as string[];
    for (const line of lines) {
        const service = line.service;
        const servicePeriod = timePeriodFns.calcPeriod(line.startTime, service.duration);
        const orderLineId = uuidv4();
        orderLineIds.push(orderLineId);

        mutations.push(
            createOrderLine({
                id: orderLineId,
                tenant_id,
                environment_id,
                order_id: orderId,
                service_id: service.id.value,
                location_id: line.locationId.value,
                start_time_24hr: servicePeriod.from.value,
                end_time_24hr: servicePeriod.to.value,
                add_on_ids: line.addOns.map((a) => a.addOn.id.value),
                date: line.date.value,
                total_price_in_minor_units: line.total.amount.value,
                total_price_currency: line.total.currency.value
            })
        );
        const bookingId = uuidv4();
        bookingIds.push(bookingId);
        mutations.push(
            createBooking({
                id: bookingId,
                environment_id,
                tenant_id,
                service_id: service.id.value,
                location_id: line.locationId.value,
                add_on_ids: line.addOns.map((a) => a.addOn.id.value),
                order_id: orderId,
                customer_id: customer.id.value,
                date: line.date.value,
                start_time_24hr: servicePeriod.from.value,
                end_time_24hr: servicePeriod.to.value,
                order_line_id: orderLineId
            })
        );
        line.service.resourceRequirements.forEach((requirement) => {
            mutations.push(toBookingResourceRequirementCreate(tenantEnvironment, requirement, bookingId));
        });
        if (shouldMakeReservations) {
            const reservationId = uuidv4();
            reservationIds.push(reservationId);
            mutations.push(
                createReservation({
                    id: reservationId,
                    booking_id: bookingId,
                    reservation_time: new Date(),
                    expiry_time: new Date(new Date().getTime() + 1000 * 60 * 30),
                    reservation_type: 'awaiting payment'
                })
            );
        }
        for (let serviceFormIndex = 0; serviceFormIndex < service.serviceFormIds.length; serviceFormIndex++) {
            mutations.push(upsertServiceFormValues(tenantEnvironment, service.serviceFormIds[serviceFormIndex], line.serviceFormData[serviceFormIndex], bookingId));
        }
    }
    return {mutations, bookingIds, reservationIds, orderLineIds};
}

export function doInsertOrder(
    tenantEnvironment: TenantEnvironment,
    everythingToCreateOrder: EverythingToCreateOrder,
    services: Service[],
    tenantSettings: TenantSettings
): { _type: 'success'; mutations: Mutations; orderCreatedResponse: OrderCreatedResponse } {
    const theId = orderId()
    const {
        mutations: orderLineMutations,
        bookingIds,
        reservationIds,
        orderLineIds
    } = processOrderLines(tenantEnvironment, everythingToCreateOrder.paymentIntent, everythingToCreateOrder.customer, everythingToCreateOrder.basket.lines, theId.value);
    const mutations = [
        ...upsertCustomerAsMutations(tenantEnvironment, everythingToCreateOrder.customer, tenantSettings),
        createOrderAsPrismaMutation(tenantEnvironment, everythingToCreateOrder, theId.value),
        ...orderLineMutations
    ];
    return {
        _type: 'success',
        mutations: mutationsConstructor(mutations),
        orderCreatedResponse: orderCreatedResponse(theId.value, everythingToCreateOrder.customer.id.value, bookingIds, reservationIds, orderLineIds)
    };
}

