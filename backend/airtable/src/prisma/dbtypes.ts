import {
    add_on,
    blocked_time,
    bookings,
    business_hours,
    cancellation_grants,
    coupons,
    customer_form_values,
    customers,
    forms,
    locations,
    mutation_events,
    order_lines,
    orders,
    pricing_rules,
    refund_rules,
    reservations,
    resource_availability,
    resource_blocked_time,
    resource_types,
    resources,
    service_forms,
    service_images,
    service_locations,
    services,
    simple_kv_store,
    tenant_branding,
    tenant_images,
    tenant_settings,
    tenants,
    time_slots,
    payment_method,
    resource_images,
    resource_markup,
    service_resource_requirements,
    booking_resource_requirements,
    service_labels,
    tenant_branding_labels,
    form_labels,
    resource_markup_labels
} from '@prisma/client';
import {TenantEnvironment} from '@breezbook/packages-types';

export type {
    resource_availability as DbResourceAvailability,
    resources as DbResource,
    resource_types as DbResourceType,
    resource_blocked_time as DbResourceBlockedTime,
    services as DbService,
    bookings as DbBooking,
    add_on as DbAddOn,
    forms as DbForm,
    business_hours as DbBusinessHours,
    blocked_time as DbBlockedTime,
    order_lines as DbOrderLine,
    orders as DbOrder,
    service_forms as DbServiceForm,
    tenant_settings as DbTenantSettings,
    time_slots as DbTimeSlot,
    pricing_rules as DbPricingRule,
    reservations as DbReservation,
    customers as DbCustomer,
    cancellation_grants as DbCancellationGrant,
    refund_rules as DbRefundRule,
    coupons as DbCoupon,
    customer_form_values as DbCustomerFormValues,
    mutation_events as DbMutationEvent,
    service_images as DbServiceImage,
    tenants as DbTenant,
    tenant_images as DbTenantImage,
    locations as DbLocation,
    service_locations as DbServiceLocation,
    tenant_branding as DbTenantBranding,
    simple_kv_store as DbSimpleKvStore,
    payment_method as DbPaymentMethod,
    resource_images as DbResourceImage,
    resource_markup as DbResourceMarkup,
    service_resource_requirements as DbServiceResourceRequirement,
    booking_resource_requirements as DbBookingResourceRequirement,
    service_labels as DbServiceLabel,
    tenant_branding_labels as DbTenantBrandingLabel,
    form_labels as DbFormLabel,
    resource_markup_labels as DbResourceMarkupLabel
};

export interface TenantEnvironmentPair {
    tenant_id: string;
    environment_id: string;
}


export function findManyForTenant(tenantEnvironment: TenantEnvironment) {
    return async function queryEntity<T>(
        entity: {
            findMany: (opts: { where: object; orderBy?: object }) => Promise<T[]>;
        },
        whereOpts: object = {},
        orderByOpts?: object
    ): Promise<T[]> {
        const tenant_id = tenantEnvironment.tenantId.value;
        const environment_id = tenantEnvironment.environmentId.value;
        // Check if orderBy is available
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if ((entity as any)?.findMany?.prototype?.hasOwnProperty('orderBy')) {
            return entity.findMany({
                where: {tenant_id, environment_id, ...whereOpts},
                orderBy: orderByOpts
            });
        } else {
            return entity.findMany({
                where: {tenant_id, environment_id, ...whereOpts}
            });
        }
    };
}
