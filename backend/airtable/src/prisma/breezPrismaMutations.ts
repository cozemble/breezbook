import {Prisma} from '@prisma/client';
import {CompositeKey, compositeKey, Create, Update, Upsert} from '../mutation/mutations.js';
import {id, mandatory, omit, pick} from '@breezbook/packages-core';

export type CreateOrder = Create<Prisma.ordersCreateArgs['data']>;

export function createOrder(data: Prisma.ordersCreateArgs['data']): CreateOrder {
    return {
        _type: 'create',
        data,
        entity: 'orders',
        entityId: compositeKey("id", mandatory(data.id, 'Order ID'))
    };
}

export type CreateBooking = Create<Prisma.bookingsCreateArgs['data']>;

export function createBooking(data: Prisma.bookingsCreateArgs['data']): CreateBooking {
    return {
        _type: 'create',
        data,
        entity: 'bookings',
        entityId: compositeKey("id", mandatory(data.id, 'Booking ID'))
    };
}

export type CreateReservation = Create<Prisma.reservationsCreateArgs['data']>;

export function createReservation(data: Prisma.reservationsCreateArgs['data']): CreateReservation {
    return {
        _type: 'create',
        data,
        entity: 'reservations',
        entityId: compositeKey("id", mandatory(data.id, 'Reservation ID'))
    };
}

export type CreateOrderLine = Create<Prisma.order_linesCreateArgs['data']>;

export function createOrderLine(data: Prisma.order_linesCreateArgs['data']): CreateOrderLine {
    return {
        _type: 'create',
        data,
        entity: 'order_lines',
        entityId: compositeKey("id", mandatory(data.id, 'Order Line ID'))
    };
}

export type CreateBookingEvent = Create<Prisma.booking_eventsCreateArgs['data']>;

export function createBookingEvent(data: Prisma.booking_eventsCreateArgs['data']): CreateBookingEvent {
    return {
        _type: 'create',
        data,
        entity: 'booking_events',
        entityId: compositeKey("id", mandatory(data.id, 'Booking Event ID'))
    };
}

type UpdateBooking = Update<Prisma.bookingsUpdateArgs['data'], Prisma.bookingsWhereUniqueInput>;

export function updateBooking(data: Prisma.bookingsUpdateArgs['data'], where: Prisma.bookingsWhereUniqueInput): UpdateBooking {
    return {
        _type: 'update',
        data,
        where,
        entity: 'bookings',
        entityId: compositeKey("id", mandatory(where.id, 'Booking ID'))
    };
}

export type UpsertCustomer = Upsert<Prisma.customersCreateArgs['data'], Prisma.customersUpdateArgs['data'], Prisma.customersUpdateArgs['where']>;

export function upsertCustomer(
    create: Prisma.customersCreateArgs['data'],
    update: Prisma.customersUpdateArgs['data'],
    where: Prisma.customersWhereUniqueInput
): UpsertCustomer {
    const entityId = compositeKey("id", mandatory(create.id, 'Customer ID'))
    return {
        _type: 'upsert',
        create: {_type: 'create', data: create, entity: 'customers', entityId},
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'customers',
            entityId
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
    const entityId = compositeKey("customer_id", mandatory(create.customer_id, 'Customer Form Values ID'))
    return {
        _type: 'upsert',
        create: {
            _type: 'create',
            data: create,
            entity: 'customer_form_values',
            entityId
        },
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'customer_form_values',
            entityId
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
    const entityId = compositeKey("booking_id", mandatory(create.booking_id, 'Booking Service Form Values ID'))
    return {
        _type: 'upsert',
        create: {
            _type: 'create',
            data: create,
            entity: 'booking_service_form_values',
            entityId
        },
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'booking_service_form_values',
            entityId
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
        entityId: compositeKey("id", mandatory(where.id, 'Cancellation Grant ID'))
    };
}

type UpsertAddOn = Upsert<Prisma.add_onCreateArgs['data'], Prisma.add_onUpdateArgs['data'], Prisma.add_onWhereUniqueInput>;
type UpsertService = Upsert<Prisma.servicesCreateArgs['data'], Prisma.servicesUpdateArgs['data'], Prisma.servicesWhereUniqueInput>;

export function upsertAddOn(
    create: Prisma.add_onCreateArgs['data'],
    update: Prisma.add_onUpdateArgs['data'],
    where: Prisma.add_onWhereUniqueInput
): UpsertAddOn {
    const entityId = compositeKey("id", mandatory(create.id, 'Add-On ID'))
    return {
        _type: 'upsert',
        create: {_type: 'create', data: create, entity: 'add_on', entityId},
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'add_on',
            entityId
        }
    };
}

export function upsertService(
    create: Prisma.servicesCreateArgs['data'],
    update: Prisma.servicesUpdateArgs['data'],
    where: Prisma.servicesWhereUniqueInput
): UpsertService {
    const entityId = compositeKey("id", mandatory(create.id, 'Service ID'))
    return {
        _type: 'upsert',
        create: {_type: 'create', data: create, entity: 'services', entityId},
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'services',
            entityId
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
        entityId: compositeKey("id", mandatory(data.id, 'Order Payment ID'))
    };

}

export function createBookingPayment(data: Prisma.booking_paymentsCreateArgs['data']): CreateBookingPayment {
    return {
        _type: 'create',
        data,
        entity: 'booking_payments',
        entityId: compositeKey("id", mandatory(data.id, 'Booking Payment ID'))
    };
}

export type UpsertBusinessHours = Upsert<Prisma.business_hoursCreateArgs['data'], Prisma.business_hoursUpdateArgs['data'], Prisma.business_hoursUpdateArgs['where']>;

export function upsertBusinessHours(create: Prisma.business_hoursCreateArgs['data']): UpsertBusinessHours {
    const update = omit(create, ["id"]) as Prisma.business_hoursUpdateArgs['data']
    const where = pick(create, ["id"]) as Prisma.business_hoursUpdateArgs['where']
    const entityId = compositeKey("id", mandatory(create.id, 'Business Hours ID'))

    return {
        _type: 'upsert',
        create: {
            _type: 'create',
            data: create,
            entity: 'business_hours',
            entityId
        },
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'business_hours',
            entityId
        },
    }
}

export type UpsertBlockedTime = Upsert<Prisma.blocked_timeCreateArgs['data'], Prisma.blocked_timeUpdateArgs['data'], Prisma.blocked_timeUpdateArgs['where']>

export function upsertBlockedTime(create: Prisma.blocked_timeCreateArgs['data']): UpsertBlockedTime {
    const update = omit(create, ["id"]) as Prisma.blocked_timeUpdateArgs['data']
    const where = pick(create, ["id"]) as Prisma.blocked_timeUpdateArgs['where']
    const entityId = compositeKey("id", mandatory(create.id, 'Blocked Time ID'))
    return {
        _type: 'upsert',
        create: {
            _type: 'create',
            data: create,
            entity: 'blocked_time',
            entityId
        },
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'blocked_time',
            entityId
        },
    }
}

export type UpsertResourceType = Upsert<Prisma.resource_typesCreateArgs['data'], Prisma.resource_typesUpdateArgs['data'], Prisma.resource_typesUpdateArgs['where']>

export function upsertResourceType(create: Prisma.resource_typesCreateArgs['data']): UpsertResourceType {
    const update = omit(create, ["id"]) as Prisma.resource_typesUpdateArgs['data']
    const where = pick(create, ["id"]) as Prisma.resource_typesUpdateArgs['where']
    const entityId = compositeKey("id", mandatory(create.id, 'Resource Type ID'))
    return {
        _type: 'upsert',
        create: {
            _type: 'create',
            data: create,
            entity: 'resource_types',
            entityId
        },
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'resource_types',
            entityId
        },
    }
}

export type UpsertResource = Upsert<Prisma.resourcesCreateArgs['data'], Prisma.resourcesUpdateArgs['data'], Prisma.resourcesUpdateArgs['where']>


export function upsertResource(create: Prisma.resourcesCreateArgs['data']): UpsertResource {
    const update = omit(create, ["id"]) as Prisma.resourcesUpdateArgs['data']
    const where = pick(create, ["id"]) as Prisma.resourcesUpdateArgs['where']
    const entityId = compositeKey("id", mandatory(create.id, 'Resource ID'))
    return {
        _type: 'upsert',
        create: {
            _type: 'create',
            data: create,
            entity: 'resources',
            entityId
        },
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'resources',
            entityId
        },
    }
}

export type UpsertResourceImage = Upsert<Prisma.resource_imagesCreateArgs['data'], Prisma.resource_imagesUpdateArgs['data'], Prisma.resource_imagesUpdateArgs['where']>

function omitPk(data: any, pk: CompositeKey): any {
    return omit(data, Object.keys(pk));
}

function pkToWhere(pk: CompositeKey): Record<string,any> {
    return pick(pk, Object.keys(pk));
}

export function upsertResourceImage(create: Prisma.resource_imagesCreateArgs['data']): UpsertResourceImage {
    const entityId = compositeKey("resource_id", mandatory(create.resource_id, "Resource ID"), "context", mandatory(create.context, 'Resource Image Context'))
    const update = omitPk(create, entityId) as Prisma.resource_imagesUpdateArgs['data']
    const where = pkToWhere(entityId) as Prisma.resource_imagesUpdateArgs['where']
    return {
        _type: 'upsert',
        create: {
            _type: 'create',
            data: create,
            entity: 'resource_images',
            entityId
        },
        update: {
            _type: 'update',
            data: update,
            where,
            entity: 'resource_images',
            entityId
        },
    }
}
