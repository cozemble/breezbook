import {Prisma} from '@prisma/client';
import {CompositeKey, compositeKey, compositeKeyFns, Create, Entity, Update, Upsert} from '../mutation/mutations.js';
import {mandatory, omit} from '@breezbook/packages-core';

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

export type CreateBookingResourceRequirement = Create<Prisma.booking_resource_requirementsCreateArgs['data']>;

export function createBookingResourceRequirement(data: Prisma.booking_resource_requirementsCreateArgs['data']): CreateBookingResourceRequirement {
    return {
        _type: 'create',
        data,
        entity: 'booking_resource_requirements',
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
    create: Prisma.customersCreateArgs['data']
): UpsertCustomer {
    const entityId = compositeKey("id", mandatory(create.id, 'Customer ID'))
    return makeUpsert('customers', entityId, create)
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
    create: Prisma.add_onCreateArgs['data']
): UpsertAddOn {
    const entityId = compositeKey("id", mandatory(create.id, 'Add-On ID'))
    return makeUpsert('add_on', entityId, create)
}

export function upsertService(
    create: Prisma.servicesCreateArgs['data']
): UpsertService {
    const entityId = compositeKey("id", mandatory(create.id, 'Service ID'))
    return makeUpsert('services', entityId, create)
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
    const entityId = compositeKey("id", mandatory(create.id, 'Business Hours ID'))
    return makeUpsert('business_hours', entityId, create)
}

export type UpsertBlockedTime = Upsert<Prisma.blocked_timeCreateArgs['data'], Prisma.blocked_timeUpdateArgs['data'], Prisma.blocked_timeUpdateArgs['where']>

export function upsertBlockedTime(create: Prisma.blocked_timeCreateArgs['data']): UpsertBlockedTime {
    const entityId = compositeKey("id", mandatory(create.id, 'Blocked Time ID'))
    return makeUpsert('blocked_time', entityId, create)
}

export type UpsertResourceType = Upsert<Prisma.resource_typesCreateArgs['data'], Prisma.resource_typesUpdateArgs['data'], Prisma.resource_typesUpdateArgs['where']>

export function upsertResourceType(create: Prisma.resource_typesCreateArgs['data']): UpsertResourceType {
    const entityId = compositeKey("id", mandatory(create.id, 'Resource Type ID'))
    return makeUpsert('resource_types', entityId, create)
}

export type UpsertResource = Upsert<Prisma.resourcesCreateArgs['data'], Prisma.resourcesUpdateArgs['data'], Prisma.resourcesUpdateArgs['where']>

export function upsertResource(create: Prisma.resourcesCreateArgs['data']): UpsertResource {
    const entityId = compositeKey("id", mandatory(create.id, 'Resource ID'))
    return makeUpsert('resources', entityId, create)
}

export type UpsertResourceImage = Upsert<Prisma.resource_imagesCreateArgs['data'], Prisma.resource_imagesUpdateArgs['data'], Prisma.resource_imagesUpdateArgs['where']>

function omitPk(data: any, pk: CompositeKey): CompositeKey {
    return omit(data, Object.keys(pk));
}

export function upsertResourceImage(create: Prisma.resource_imagesCreateArgs['data']): UpsertResourceImage {
    const entityId = compositeKey(
        "resource_id", mandatory(create.resource_id, "Resource ID"),
        "context", mandatory(create.context, 'Resource Image Context'))
    return makeUpsert('resource_images', entityId, create)
}

export type UpsertResourceMarkup = Upsert<Prisma.resource_markupCreateArgs['data'], Prisma.resource_markupUpdateArgs['data'], Prisma.resource_markupUpdateArgs['where']>

export function upsertResourceMarkup(create: Prisma.resource_markupCreateArgs['data']): UpsertResourceMarkup {
    const entityId = compositeKey(
        "resource_id", mandatory(create.resource_id, "Resource ID"),
        "context", mandatory(create.context, 'Resource Markup Context'))
    return makeUpsert('resource_markup', entityId, create)
}

function toPrismaWhereClause(entityId: CompositeKey): any {
    if (compositeKeyFns.keys(entityId).length === 1) {
        return entityId
    }
    const prismaUniquePropertyName = compositeKeyFns.keys(entityId).join("_")
    return {[prismaUniquePropertyName]: entityId}
}

function makeUpsert<TCreate, TUpdate, TWhere>(entity: Entity, entityId: CompositeKey, create: TCreate): Upsert<TCreate, TUpdate, TWhere> {
    const update = omitPk(create, entityId) as TUpdate
    const where = toPrismaWhereClause(entityId) as TWhere
    return {
        _type: 'upsert',
        create: {
            _type: 'create',
            data: create,
            entity,
            entityId
        },
        update: {
            _type: 'update',
            data: update,
            where,
            entity,
            entityId
        },
    }

}

export type UpsertResourceAvailability = Upsert<Prisma.resource_availabilityCreateArgs['data'], Prisma.resource_availabilityUpdateArgs['data'], Prisma.resource_availabilityUpdateArgs['where']>

export function upsertResourceAvailability(create: Prisma.resource_availabilityCreateArgs['data']): UpsertResourceAvailability {
    const entityId = compositeKey(
        "id", mandatory(create.id, "Resource Availability ID"))
    return makeUpsert('resource_availability', entityId, create)
}

export type UpsertTenantSettings = Upsert<Prisma.tenant_settingsCreateArgs['data'], Prisma.tenant_settingsUpdateArgs['data'], Prisma.tenant_settingsUpdateArgs['where']>

export function upsertTenantSettings(create: Prisma.tenant_settingsCreateArgs['data']): UpsertTenantSettings {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "Tenant ID"),
        "environment_id", mandatory(create.environment_id, "Environment ID"))
    return makeUpsert('tenant_settings', entityId, create)
}

export type UpsertTenantBranding = Upsert<Prisma.tenant_brandingCreateArgs['data'], Prisma.tenant_brandingUpdateArgs['data'], Prisma.tenant_brandingUpdateArgs['where']>

export function upsertTenantBranding(create: Prisma.tenant_brandingCreateArgs['data']): UpsertTenantBranding {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "Tenant ID"),
        "environment_id", mandatory(create.environment_id, "Environment ID"))
    return makeUpsert('tenant_branding', entityId, create)
}

export type UpsertServiceLocation = Upsert<Prisma.service_locationsCreateArgs['data'], Prisma.service_locationsUpdateArgs['data'], Prisma.service_locationsUpdateArgs['where']>

export function upsertServiceLocation(create: Prisma.service_locationsCreateArgs['data']): UpsertServiceLocation {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "Tenant ID"),
        "environment_id", mandatory(create.environment_id, "Environment ID"),
        "service_id", mandatory(create.service_id, "Service ID"),
        "location_id", mandatory(create.location_id, "Location ID")
    )
    return makeUpsert('service_locations', entityId, create)
}

export type UpsertTenant = Upsert<Prisma.tenantsCreateArgs['data'], Prisma.tenantsUpdateArgs['data'], Prisma.tenantsUpdateArgs['where']>

export function upsertTenant(create: Prisma.tenantsCreateArgs['data']): UpsertTenant {
    const entityId = compositeKey("tenant_id", mandatory(create.tenant_id, "Tenant ID"))
    return makeUpsert('tenants', entityId, create)
}

export type UpsertLocation = Upsert<Prisma.locationsCreateArgs['data'], Prisma.locationsUpdateArgs['data'], Prisma.locationsUpdateArgs['where']>

export function upsertLocation(create: Prisma.locationsCreateArgs['data']): UpsertLocation {
    const entityId = compositeKey("id", mandatory(create.id, "Location ID"))
    return makeUpsert('locations', entityId, create)
}

export type UpsertForm = Upsert<Prisma.formsCreateArgs['data'], Prisma.formsUpdateArgs['data'], Prisma.formsUpdateArgs['where']>

export function upsertForm(create: Prisma.formsCreateArgs['data']): UpsertForm {
    const entityId = compositeKey("id", mandatory(create.id, "Form ID"))
    return makeUpsert('forms', entityId, create)
}

export type UpsertServiceForm = Upsert<Prisma.service_formsCreateArgs['data'], Prisma.service_formsUpdateArgs['data'], Prisma.service_formsUpdateArgs['where']>

export function upsertServiceForm(create: Prisma.service_formsCreateArgs['data']): UpsertServiceForm {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "Tenant ID"),
        "environment_id", mandatory(create.environment_id, "environment_id"),
        "service_id", mandatory(create.service_id, "service_id"),
        "form_id", mandatory(create.form_id, "form_id"))
    return makeUpsert('service_forms', entityId, create)
}

export type UpsertServiceResourceRequirement = Upsert<Prisma.service_resource_requirementsCreateArgs['data'], Prisma.service_resource_requirementsUpdateArgs['data'], Prisma.service_resource_requirementsUpdateArgs['where']>

export function upsertServiceResourceRequirement(create: Prisma.service_resource_requirementsCreateArgs['data']): UpsertServiceResourceRequirement {
    const entityId = compositeKey("id", mandatory(create.id, "Service Resource Requirement ID"))
    return makeUpsert('service_resource_requirements', entityId, create)
}

export type UpsertPricingRule = Upsert<Prisma.pricing_rulesCreateArgs['data'], Prisma.pricing_rulesUpdateArgs['data'], Prisma.pricing_rulesUpdateArgs['where']>

export function upsertPricingRule(create: Prisma.pricing_rulesCreateArgs['data']): UpsertPricingRule {
    const entityId = compositeKey("id", mandatory(create.id, "Service Resource Requirement ID"))
    return makeUpsert('pricing_rules', entityId, create)
}

