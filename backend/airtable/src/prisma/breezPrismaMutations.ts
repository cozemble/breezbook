import {Prisma} from '@prisma/client';
import {CompositeKey, compositeKey, compositeKeyFns, Create, Entity, Update, Upsert} from '../mutation/mutations.js';
import {mandatory, omit} from '@breezbook/packages-core';
import {v4 as uuid} from 'uuid';

export type CreateOrder = Create<Prisma.ordersCreateArgs['data']>;

export function createOrder(data: Prisma.ordersUncheckedCreateInput): CreateOrder {
    return {
        _type: 'create',
        data,
        entity: 'orders',
        entityId: compositeKey("id", mandatory(data.id, 'Order ID'))
    };
}

export type CreateBooking = Create<Prisma.bookingsCreateArgs['data']>;

export function createBooking(minusId: Omit<Prisma.bookingsUncheckedCreateInput, 'id'>): CreateBooking {
    const data = {...minusId, id: makeId(minusId.environment_id, "bookings")}
    return {
        _type: 'create',
        data,
        entity: 'bookings',
        entityId: compositeKey("id", mandatory(data.id, 'Booking ID'))
    };
}

export type CreateBookingResourceRequirement = Create<Prisma.booking_resource_requirementsCreateArgs['data']>;

export function createBookingResourceRequirement(minusId: Omit<Prisma.booking_resource_requirementsUncheckedCreateInput, 'id'>): CreateBookingResourceRequirement {
    const data = {...minusId, id: makeId(minusId.environment_id, "booking_resource_requirements")}
    return {
        _type: 'create',
        data,
        entity: 'booking_resource_requirements',
        entityId: compositeKey("id", mandatory(data.id, 'Booking ID'))
    };
}

export type CreateReservation = Create<Prisma.reservationsCreateArgs['data']>;

export function createReservation(minusId: Omit<Prisma.reservationsUncheckedCreateInput, 'id'>): CreateReservation {
    const data = {...minusId, id: makeId(minusId.environment_id, "reservations")}
    return {
        _type: 'create',
        data,
        entity: 'reservations',
        entityId: compositeKey("id", mandatory(data.id, 'Reservation ID'))
    };
}

export type CreateOrderLine = Create<Prisma.order_linesCreateArgs['data']>;

export function createOrderLine(minusId: Omit<Prisma.order_linesUncheckedCreateInput, 'id'>): CreateOrderLine {
    const data = {...minusId, id: makeId(minusId.environment_id, "order_lines")}
    return {
        _type: 'create',
        data,
        entity: 'order_lines',
        entityId: compositeKey("id", mandatory(data.id, 'Order Line ID'))
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
export type UpsertService = Upsert<Prisma.servicesCreateArgs['data'], Prisma.servicesUpdateArgs['data'], Prisma.servicesWhereUniqueInput>;

export function upsertAddOn(
    create: Prisma.add_onCreateArgs['data']
): UpsertAddOn {
    const entityId = compositeKey("id", mandatory(create.id, 'Add-On ID'))
    return makeUpsert('add_on', entityId, create)
}

export function makeId(environment_id: string, entity: string, id = uuid().replace(/-/g, '')): string {
    return `${entity}_${environment_id}_${id}`
}

export function upsertService(
    create: Prisma.servicesCreateArgs['data']
): UpsertService {
    const entityId = compositeKey("id", mandatory(create.id, 'Service ID'))
    return makeUpsert('services', entityId, create)
}

export type CreateOrderPayment = Create<Prisma.order_paymentsCreateArgs['data']>;
export type CreateBookingPayment = Create<Prisma.booking_paymentsCreateArgs['data']>;

export function createOrderPayment(minusId: Omit<Prisma.order_paymentsUncheckedCreateInput, 'id'>): CreateOrderPayment {
    const data = {...minusId, id: makeId(minusId.environment_id, "order_payments")}
    return {
        _type: 'create',
        data,
        entity: 'order_payments',
        entityId: compositeKey("id", mandatory(data.id, 'Order Payment ID'))
    };
}

export function createBookingPayment(minusId: Omit<Prisma.booking_paymentsUncheckedCreateInput, 'id'>): CreateBookingPayment {
    const data = {...minusId, id: makeId(minusId.environment_id, "booking_payments")}
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

export function upsertServiceLocation(create: Prisma.service_locationsUncheckedCreateInput): UpsertServiceLocation {
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

export type UpsertServiceLabel = Upsert<Prisma.service_labelsCreateArgs['data'], Prisma.service_labelsUpdateArgs['data'], Prisma.service_labelsUpdateArgs['where']>

export function upsertServiceLabel(create: Prisma.service_labelsCreateArgs['data']): UpsertServiceLabel {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "tenant_id"),
        "environment_id", mandatory(create.environment_id, "environment_id"),
        "service_id", mandatory(create.service_id, "service_id"),
        "language_id", mandatory(create.language_id, "language_id"))
    return makeUpsert('service_labels', entityId, create)
}

export type UpsertTimeslot = Upsert<Prisma.time_slotsCreateArgs['data'], Prisma.time_slotsUpdateArgs['data'], Prisma.time_slotsUpdateArgs['where']>

export function upsertTimeslot(create: Prisma.time_slotsUncheckedCreateInput): UpsertTimeslot {
    const entityId = compositeKey("id", mandatory(create.id, "Timeslot ID"))
    return makeUpsert('time_slots', entityId, create)
}

export type UpsertCoupon = Upsert<Prisma.couponsCreateArgs['data'], Prisma.couponsUpdateArgs['data'], Prisma.couponsUpdateArgs['where']>

export function upsertCoupon(create: Prisma.couponsUncheckedCreateInput): UpsertCoupon {
    const entityId = compositeKey("id", mandatory(create.id, "Coupon ID"))
    return makeUpsert('coupons', entityId, create)
}

export type UpsertServiceImage = Upsert<Prisma.service_imagesCreateArgs['data'], Prisma.service_imagesUpdateArgs['data'], Prisma.service_imagesUpdateArgs['where']>

export function upsertServiceImage(create: Prisma.service_imagesUncheckedCreateInput): UpsertServiceImage {
    const entityId = compositeKey(
        "service_id", mandatory(create.service_id, "Service ID"),
        "tenant_id", mandatory(create.tenant_id, "Tenant ID"),
        "environment_id", mandatory(create.environment_id, "Environment ID"),
        "context", mandatory(create.context, "Service Image Context"))
    return makeUpsert('service_images', entityId, create)
}

export type UpsertTenantImage = Upsert<Prisma.tenant_imagesCreateArgs['data'], Prisma.tenant_imagesUpdateArgs['data'], Prisma.tenant_imagesUpdateArgs['where']>

export function upsertTenantImage(create: Prisma.tenant_imagesUncheckedCreateInput): UpsertTenantImage {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "Tenant ID"),
        "environment_id", mandatory(create.environment_id, "Environment ID"),
        "context", mandatory(create.context, "Service Image Context"))
    return makeUpsert('tenant_images', entityId, create)
}

export type UpsertTenantBrandingLabels = Upsert<Prisma.tenant_branding_labelsCreateArgs['data'], Prisma.tenant_branding_labelsUpdateArgs['data'], Prisma.tenant_branding_labelsUpdateArgs['where']>

export function upsertTenantBrandingLabels(create: Prisma.tenant_branding_labelsUncheckedCreateInput): UpsertTenantBrandingLabels {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "tenant_id"),
        "environment_id", mandatory(create.environment_id, "environment_id"),
        "language_id", mandatory(create.language_id, "language_id"),)
    return makeUpsert('tenant_branding_labels', entityId, create)
}

export type UpsertAddOnLabels = Upsert<Prisma.add_on_labelsCreateArgs['data'], Prisma.add_on_labelsUpdateArgs['data'], Prisma.add_on_labelsUpdateArgs['where']>

export function upsertAddOnLabels(create: Prisma.add_on_labelsUncheckedCreateInput): UpsertAddOnLabels {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "tenant_id"),
        "environment_id", mandatory(create.environment_id, "environment_id"),
        "add_on_id", mandatory(create.add_on_id, "add_on_id"),
        "language_id", mandatory(create.language_id, "language_id"),
    )
    return makeUpsert('add_on_labels', entityId, create)
}

export type UpsertFormLabels = Upsert<Prisma.form_labelsCreateArgs['data'], Prisma.form_labelsUpdateArgs['data'], Prisma.form_labelsUpdateArgs['where']>

export function upsertFormLabels(create: Prisma.form_labelsUncheckedCreateInput): UpsertFormLabels {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "tenant_id"),
        "environment_id", mandatory(create.environment_id, "environment_id"),
        "form_id", mandatory(create.form_id, "form_id"),
        "language_id", mandatory(create.language_id, "language_id"),
    )
    return makeUpsert('form_labels', entityId, create)
}

export type UpsertResourceMarkupLabels = Upsert<Prisma.resource_markup_labelsCreateArgs['data'], Prisma.resource_markup_labelsUpdateArgs['data'], Prisma.resource_markup_labelsUpdateArgs['where']>

export function upsertResourceMarkupLabels(create: Prisma.resource_markup_labelsUncheckedCreateInput): UpsertResourceMarkupLabels {
    const entityId = compositeKey("resource_markup_id", mandatory(create.resource_markup_id, "resource_markup_id"),
        "language_id", mandatory(create.language_id, "language_id"),
    )
    return makeUpsert('resource_markup_labels', entityId, create)
}

export type UpsertServiceTimeslot = Upsert<Prisma.service_time_slotsCreateArgs['data'], Prisma.service_time_slotsUpdateArgs['data'], Prisma.service_time_slotsUpdateArgs['where']>

export function upsertServiceTimeslot(create: Prisma.service_time_slotsUncheckedCreateInput): UpsertServiceTimeslot {
    const entityId = compositeKey("id", mandatory(create.id, "id"))
    return makeUpsert('service_time_slots', entityId, create)
}

export type UpsertServiceOption = Upsert<Prisma.service_optionsCreateArgs['data'], Prisma.service_optionsUpdateArgs['data'], Prisma.service_optionsUpdateArgs['where']>

export function upsertServiceOption(create: Prisma.service_optionsUncheckedCreateInput): UpsertServiceOption {
    const entityId = compositeKey("id", mandatory(create.id, "id"))
    return makeUpsert('service_options', entityId, create)
}

export type UpsertServiceOptionLabel = Upsert<Prisma.service_option_labelsCreateArgs['data'], Prisma.service_option_labelsUpdateArgs['data'], Prisma.service_option_labelsUpdateArgs['where']>

export function upsertServiceOptionLabel(create: Prisma.service_option_labelsUncheckedCreateInput): UpsertServiceOptionLabel {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "tenant_id"),
        "environment_id", mandatory(create.environment_id, "environment_id"),
        "service_option_id", mandatory(create.service_option_id, "service_option_id"),
        "language_id", mandatory(create.language_id, "language_id")
    )
    return makeUpsert('service_option_labels', entityId, create)
}

export type UpsertServiceServiceOption = Upsert<Prisma.service_service_optionsCreateArgs['data'], Prisma.service_service_optionsUpdateArgs['data'], Prisma.service_service_optionsUpdateArgs['where']>

export function upsertServiceServiceOption(create: Prisma.service_service_optionsUncheckedCreateInput): UpsertServiceServiceOption {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "tenant_id"),
        "environment_id", mandatory(create.environment_id, "environment_id"),
        "service_id", mandatory(create.service_id, "service_id"),
        "service_option_id", mandatory(create.service_option_id, "service_option_id")
    )
    return makeUpsert('service_service_options', entityId, create)
}

export type UpsertServiceOptionForm = Upsert<Prisma.service_option_formsCreateArgs['data'], Prisma.service_option_formsUpdateArgs['data'], Prisma.service_option_formsUpdateArgs['where']>

export function upsertServiceOptionForm(create: Prisma.service_option_formsUncheckedCreateInput): UpsertServiceOptionForm {
    const entityId = compositeKey(
        "tenant_id", mandatory(create.tenant_id, "tenant_id"),
        "environment_id", mandatory(create.environment_id, "environment_id"),
        "service_option_id", mandatory(create.service_option_id, "service_option_id"),
        "form_id", mandatory(create.form_id, "form_id")
    )
    return makeUpsert('service_option_forms', entityId, create)
}

