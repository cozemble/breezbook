import {
	add_on,
	blocked_time,
	bookings,
	business_hours,
	forms,
	order_lines,
	orders,
	resource_availability,
	resource_blocked_time,
	resource_types,
	resources,
	service_forms,
	services,
	tenant_settings,
	time_slots,
	pricing_rules,
	reservations,
	customers,
	system_outbound_webhooks
} from '@prisma/client';
import { TenantEnvironment } from '@breezbook/packages-core';

export {
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
	system_outbound_webhooks as DbSystemOutboundWebhook
};

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
