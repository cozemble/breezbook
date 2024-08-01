import {Customer, PaymentIntent, TenantSettings,} from '@breezbook/packages-core';
import {orderCreatedResponse, OrderCreatedResponse} from '@breezbook/backend-api-types';
import {Prisma} from '@prisma/client';
import {
    createBooking, CreateBookingAnySuitableResourceRequirement, createBookingAnySuitableResourceRequirement,
    createBookingResourceRequirement,
    CreateBookingResourceRequirement,
    createOrder,
    CreateOrder,
    createOrderLine,
    createReservation,
    makeId,
    upsertBookingLineAddOn,
    upsertBookingServiceFormValues,
    UpsertBookingServiceFormValues,
    upsertBookingServiceOption,
    upsertCustomer,
    upsertCustomerFormValues,
    upsertOrderLineAddOn,
    upsertOrderLineServiceOption
} from '../prisma/breezPrismaMutations.js';
import {Mutation, Mutations, mutations as mutationsConstructor} from '../mutation/mutations.js';
import {DbPaymentMethod} from "../prisma/dbtypes.js";
import {EverythingToCreateOrder, HydratedBasketLine} from "./onAddOrderExpress.js";
import {FormId, mandatory, orderId, TenantEnvironment, timePeriodFns} from "@breezbook/packages-types";
import {resourcing} from "@breezbook/packages-resourcing";
import ResourceRequirement = resourcing.ResourceRequirement;

function upsertCustomerAsMutations(tenantEnvironment: TenantEnvironment, customer: Customer, tenantSettings: TenantSettings): Mutation[] {
    const tenant_id = tenantEnvironment.tenantId.value;
    const environment_id = tenantEnvironment.environmentId.value;
    const email = customer.email.value;
    const customerUpsert = upsertCustomer(
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
    const upserts: Mutation[] = [customerUpsert];
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
    serviceFormData: any | null,
    bookingId: string
): UpsertBookingServiceFormValues {
    if (serviceFormData === undefined) {
        throw new Error("Service form data is undefined");
    }
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

function toBookingResourceRequirementCreate(tenantEnvironment: TenantEnvironment, requirement: ResourceRequirement, bookingId: string): CreateBookingResourceRequirement|CreateBookingAnySuitableResourceRequirement {
    if (requirement._type === "complex.resource.requirement") {
        throw new Error("Cannot handle complex resource requirements");
    }
    if (requirement._type === "specific.resource") {
        return createBookingResourceRequirement({
            tenant_id: tenantEnvironment.tenantId.value,
            environment_id: tenantEnvironment.environmentId.value,
            booking_id: bookingId,
            requirement_id: requirement.id.value,
            resource_id: requirement.resource.id.value,
            requirement_type: 'specific_resource'
        })
    } else {
        return createBookingAnySuitableResourceRequirement({
            tenant_id: tenantEnvironment.tenantId.value,
            environment_id: tenantEnvironment.environmentId.value,
            booking_id: bookingId,
            requirement_id: requirement.id.value,
            requirement_type: 'any_suitable',
        }, requirement.resourceType.value);
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
        const servicePeriod = timePeriodFns.calcPeriod(line.startTime, line.duration);

        const createOrderLineMutation = createOrderLine({
            tenant_id,
            environment_id,
            order_id: orderId,
            service_id: service.id.value,
            location_id: line.locationId.value,
            start_time_24hr: servicePeriod.from.value,
            end_time_24hr: servicePeriod.to.value,
            date: line.date.value,
            total_price_in_minor_units: line.total.amount.value,
            total_price_currency: line.total.currency.value
        })
        orderLineIds.push(createOrderLineMutation.data.id);
        mutations.push(createOrderLineMutation);
        const createBookingMutation = createBooking({
            environment_id,
            tenant_id,
            service_id: service.id.value,
            location_id: line.locationId.value,
            order_id: orderId,
            customer_id: customer.id.value,
            date: line.date.value,
            start_time_24hr: servicePeriod.from.value,
            end_time_24hr: servicePeriod.to.value,
            order_line_id: createOrderLineMutation.data.id,
            booked_capacity: line.capacity.value
        });
        const bookingId = createBookingMutation.data.id;
        bookingIds.push(bookingId);
        mutations.push(createBookingMutation);
        line.service.resourceRequirements.forEach((requirement) => {
            mutations.push(toBookingResourceRequirementCreate(tenantEnvironment, requirement, bookingId));
        });
        line.addOns
            .flatMap(a => [
                upsertOrderLineAddOn({
                    tenant_id,
                    environment_id,
                    order_line_id: createOrderLineMutation.data.id,
                    add_on_id: a.addOn.id.value,
                    quantity: a.quantity
                }),
                upsertBookingLineAddOn({
                    tenant_id,
                    environment_id,
                    booking_id: bookingId,
                    add_on_id: a.addOn.id.value,
                    quantity: a.quantity
                })
            ])
            .forEach(m => mutations.push(m));
        line.options.flatMap(o => [
            upsertOrderLineServiceOption({
                tenant_id,
                environment_id,
                order_line_id: createOrderLineMutation.data.id,
                service_option_id: o.option.id.value,
                quantity: o.quantity
            }),
            upsertBookingServiceOption({
                tenant_id,
                environment_id,
                booking_id: bookingId,
                service_option_id: o.option.id.value,
                quantity: o.quantity
            })
        ]).forEach(m => mutations.push(m));

        if (shouldMakeReservations) {
            const createReservationMutation = createReservation({
                environment_id,
                tenant_id,
                booking_id: bookingId,
                reservation_time: new Date(),
                expiry_time: new Date(new Date().getTime() + 1000 * 60 * 30),
                reservation_type: 'awaiting payment'
            });
            reservationIds.push(createReservationMutation.data.id);
            mutations.push(
                createReservationMutation
            );
        }
        for (let serviceFormIndex = 0; serviceFormIndex < service.serviceFormIds.length; serviceFormIndex++) {
            mutations.push(upsertServiceFormValues(tenantEnvironment, mandatory(service.serviceFormIds[serviceFormIndex], `No service form id`), line.serviceFormData[serviceFormIndex], bookingId));
        }
    }
    return {mutations, bookingIds, reservationIds, orderLineIds};
}

export function doInsertOrder(
    tenantEnvironment: TenantEnvironment,
    everythingToCreateOrder: EverythingToCreateOrder,
    tenantSettings: TenantSettings
): { _type: 'success'; mutations: Mutations; orderCreatedResponse: OrderCreatedResponse } {
    const theId = orderId(makeId(tenantEnvironment.environmentId.value, 'orders'))
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

