import {Prisma} from '@prisma/client';
import {Create, Update, Upsert} from '../mutation/mutations.js';
import {id, mandatory} from '@breezbook/packages-core';

export type CreateOrder = Create<Prisma.ordersCreateArgs['data']>;

export function createOrder(data: Prisma.ordersCreateArgs['data']): CreateOrder {
    return {
        _type: 'create',
        data,
        entity: 'orders',
        entityId: id(mandatory(data.id, 'Order ID'))
    };
}

export type CreateBooking = Create<Prisma.bookingsCreateArgs['data']>;

export function createBooking(data: Prisma.bookingsCreateArgs['data']): CreateBooking {
    return {
        _type: 'create',
        data,
        entity: 'bookings',
        entityId: id(mandatory(data.id, 'Booking ID'))
    };
}

export type CreateReservation = Create<Prisma.reservationsCreateArgs['data']>;

export function createReservation(data: Prisma.reservationsCreateArgs['data']): CreateReservation {
    return {
        _type: 'create',
        data,
        entity: 'reservations',
        entityId: id(mandatory(data.id, 'Reservation ID'))
    };
}

export type CreateOrderLine = Create<Prisma.order_linesCreateArgs['data']>;

export function createOrderLine(data: Prisma.order_linesCreateArgs['data']): CreateOrderLine {
    return {
        _type: 'create',
        data,
        entity: 'order_lines',
        entityId: id(mandatory(data.id, 'Order Line ID'))
    };
}

export type CreateBookingEvent = Create<Prisma.booking_eventsCreateArgs['data']>;

export function createBookingEvent(data: Prisma.booking_eventsCreateArgs['data']): CreateBookingEvent {
    return {
        _type: 'create',
        data,
        entity: 'booking_events',
        entityId: id(mandatory(data.id, 'Booking Event ID'))
    };
}

type UpdateBooking = Update<Prisma.bookingsUpdateArgs['data'], Prisma.bookingsWhereUniqueInput>;

export function updateBooking(data: Prisma.bookingsUpdateArgs['data'], where: Prisma.bookingsWhereUniqueInput): UpdateBooking {
    return {
        _type: 'update',
        data,
        where,
        entity: 'bookings',
        entityId: id(mandatory(where.id, 'Booking ID'))
    };
}

export type UpsertCustomer = Upsert<Prisma.customersCreateArgs['data'], Prisma.customersUpdateArgs['data'], Prisma.customersUpdateArgs['where']>;

export function upsertCustomer(
    create: Prisma.customersCreateArgs['data'],
    update: Prisma.customersUpdateArgs['data'],
    where: Prisma.customersWhereUniqueInput
): UpsertCustomer {
    return {
        _type: 'upsert',
        create: {_type: 'create', data: create, entity: 'customers', entityId: id(mandatory(create.id, 'Customer ID'))},
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'customers',
            entityId: id(mandatory(create.id, 'Customer ID'))
        }
    };
}

export type UpsertCustomerFormValues = Upsert<
    Prisma.customer_form_valuesCreateArgs['data'],
    Prisma.customer_form_valuesUpdateArgs['data'],
    Prisma.customer_form_valuesUpdateArgs['where']
>;

export function upsertCustomerFormValues(
    create: Prisma.customer_form_valuesCreateArgs['data'],
    update: Prisma.customer_form_valuesUpdateArgs['data'],
    where: Prisma.customer_form_valuesWhereUniqueInput
): UpsertCustomerFormValues {
    return {
        _type: 'upsert',
        create: {
            _type: 'create',
            data: create,
            entity: 'customer_form_values',
            entityId: id(mandatory(create.customer_id, 'Customer Form Values ID'))
        },
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'customer_form_values',
            entityId: id(mandatory(create.customer_id, 'Customer Form Values ID'))
        }
    };
}

export type UpsertBookingServiceFormValues = Upsert<
    Prisma.booking_service_form_valuesCreateArgs['data'],
    Prisma.booking_service_form_valuesUpdateArgs['data'],
    Prisma.booking_service_form_valuesUpdateArgs['where']
>;

export function upsertBookingServiceFormValues(
    create: Prisma.booking_service_form_valuesCreateArgs['data'],
    update: Prisma.booking_service_form_valuesUpdateArgs['data'],
    where: Prisma.booking_service_form_valuesWhereUniqueInput
): UpsertBookingServiceFormValues {
    return {
        _type: 'upsert',
        create: {
            _type: 'create',
            data: create,
            entity: 'booking_service_form_values',
            entityId: id(mandatory(create.booking_id, 'Booking Service Form Values ID'))
        },
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'booking_service_form_values',
            entityId: id(mandatory(create.booking_id, 'Booking Service Form Values ID'))
        }
    };
}

type UpdateCancellationGrant = Update<Prisma.cancellation_grantsUpdateArgs['data'], Prisma.cancellation_grantsWhereUniqueInput>;

export function updateCancellationGrant(
    data: Prisma.cancellation_grantsUpdateArgs['data'],
    where: Prisma.cancellation_grantsWhereUniqueInput
): UpdateCancellationGrant {
    return {
        _type: 'update',
        data,
        where,
        entity: 'cancellation_grants',
        entityId: id(mandatory(where.id, 'Cancellation Grant ID'))
    };
}

type UpsertAddOn = Upsert<Prisma.add_onCreateArgs['data'], Prisma.add_onUpdateArgs['data'], Prisma.add_onWhereUniqueInput>;
type UpsertService = Upsert<Prisma.servicesCreateArgs['data'], Prisma.servicesUpdateArgs['data'], Prisma.servicesWhereUniqueInput>;

export function upsertAddOn(
    create: Prisma.add_onCreateArgs['data'],
    update: Prisma.add_onUpdateArgs['data'],
    where: Prisma.add_onWhereUniqueInput
): UpsertAddOn {
    return {
        _type: 'upsert',
        create: {_type: 'create', data: create, entity: 'add_on', entityId: id(mandatory(create.id, 'Add-On ID'))},
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'add_on',
            entityId: id(mandatory(create.id, 'Add-On ID'))
        }
    };
}

export function upsertService(
    create: Prisma.servicesCreateArgs['data'],
    update: Prisma.servicesUpdateArgs['data'],
    where: Prisma.servicesWhereUniqueInput
): UpsertService {
    return {
        _type: 'upsert',
        create: {_type: 'create', data: create, entity: 'services', entityId: id(mandatory(create.id, 'Service ID'))},
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'services',
            entityId: id(mandatory(create.id, 'Service ID'))
        }
    };
}

export type CreateOrderPayment = Create<Prisma.order_paymentsCreateArgs['data']>;
export type CreateBookingPayment = Create<Prisma.booking_paymentsCreateArgs['data']>;

export function createOrderPayment(data: Prisma.order_paymentsCreateArgs['data']): CreateOrderPayment {
    return {
        _type: 'create',
        data,
        entity: 'order_payments',
        entityId: id(mandatory(data.id, 'Order Payment ID'))
    };

}

export function createBookingPayment(data: Prisma.booking_paymentsCreateArgs['data']): CreateBookingPayment {
    return {
        _type: 'create',
        data,
        entity: 'booking_payments',
        entityId: id(mandatory(data.id, 'Booking Payment ID'))
    };
}
