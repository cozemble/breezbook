import { resource_availability, resource_blocked_time, resource_types, resources, services, bookings, add_on, forms, business_hours, blocked_time, order_lines, orders, service_forms,tenant_settings } from '@prisma/client';
import { TenantId } from '@breezbook/packages-core';

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
	tenant_settings as DbTenantSettings
};


export function findManyForTenant(tenantId: TenantId) {
	return async function queryEntity<T>(
		entity: {
			findMany: (opts: { where: object, orderBy?: object }) => Promise<T[]>
		},
		whereOpts: object = {},
		orderByOpts?: object
	): Promise<T[]> {

		// Check if orderBy is available
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		if ((entity as any)?.findMany?.prototype?.hasOwnProperty('orderBy')) {
			return entity.findMany({
				where: { tenant_id: tenantId.value, ...whereOpts },
				orderBy: orderByOpts
			});
		} else {
			return entity.findMany({
				where: { tenant_id: tenantId.value, ...whereOpts }
			});
		}
	};}
