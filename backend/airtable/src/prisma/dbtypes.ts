import {
	add_on,
	add_on_images,
	add_on_labels,
	blocked_time,
	booking_add_ons,
	booking_resource_requirements,
	booking_service_options,
	bookings,
	business_hours,
	cancellation_grants,
	coupons,
	customer_form_values,
	customers,
	form_labels,
	forms,
	locations,
	mutation_events,
	order_line_add_ons,
	order_line_service_options,
	order_lines,
	orders,
	payment_method,
	pricing_rules,
	refund_rules,
	reservations,
	resource_availability,
	resource_blocked_time,
	resource_images,
	resource_markup,
	resource_markup_labels,
	resource_types,
	resources,
	service_add_ons,
	service_forms,
	service_images,
	service_labels,
	service_location_prices,
	service_locations,
	service_option_forms,
	service_option_images,
	service_option_labels,
	service_option_resource_requirements,
	service_options,
	service_resource_requirements,
	service_schedule_config,
	service_service_options,
	services,
	simple_kv_store,
	tenant_branding,
	tenant_branding_labels,
	tenant_images,
	tenant_settings,
	tenants,
	time_slots
} from '@prisma/client';
import { TenantEnvironment } from '@breezbook/packages-types';

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
	resource_markup_labels as DbResourceMarkupLabel,
	service_options as DbServiceOption,
	service_option_labels as DbServiceOptionLabel,
	service_service_options as DbServiceServiceOption,
	service_option_images as DbServiceOptionImage,
	add_on_images as DbAddOnImage,
	service_option_resource_requirements as DbServiceOptionResourceRequirement,
	service_option_forms as DbServiceOptionForm,
	service_add_ons as DbServiceAddOn,
	order_line_add_ons as DbOrderLineAddOn,
	order_line_service_options as DbOrderLineServiceOption,
	booking_add_ons as DbBookingAddOn,
	booking_service_options as DbBookingServiceOption,
	add_on_labels as DbAddOnLabel,
	service_schedule_config as DbServiceScheduleConfig,
	service_location_prices as DbServiceLocationPrice
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
				where: { tenant_id, environment_id, ...whereOpts },
				orderBy: orderByOpts
			});
		} else {
			return entity.findMany({
				where: { tenant_id, environment_id, ...whereOpts }
			});
		}
	};
}
