import * as express from 'express';
import { environmentIdParam, withOneRequestParam } from '../../infra/functionalExpress.js';
import { DbExpressBridge } from '../../infra/dbExpressBridge.js';
import { DbBooking, DbCustomer, DbForm, DbLastShovlOut, DbService, DbServiceForm, DbTenantSettings } from '../../prisma/dbtypes.js';
import camelCase from 'camelcase';
import { prismaClient } from '../../prisma/client.js';
import { PrismaClient } from '@prisma/client';
import { mandatory } from '@breezbook/packages-core';

async function getLastShovlOut(environmentId: string, prisma: PrismaClient, entityType: string): Promise<DbLastShovlOut> {
	const last = await prisma.last_shovl_out.findUnique({
		where: {
			environment_id_entity_type: {
				environment_id: environmentId,
				entity_type: entityType
			}
		}
	});
	if (!last) {
		return {
			environment_id: environmentId,
			entity_type: entityType,
			last_shovl_out: new Date(0)
		};
	}
	return last;
}

interface ShovlOutResult {
	jsonPayloads: any[];
	lastShovlOutUpdate: DbLastShovlOut;
}

function serviceShovlOutJson(service: DbService) {
	return {
		tenantId: service.tenant_id,
		environmentId: service.environment_id,
		id: service.id,
		name: service.name,
		description: service.description,
		durationMinutes: service.duration_minutes,
		price: service.price,
		priceCurrency: service.price_currency,
		permittedAddOnIds: service.permitted_add_on_ids,
		resourceTypesRequired: service.resource_types_required,
		requiresTimeSlot: service.requires_time_slot,
		createdAt: service.created_at,
		updatedAt: service.updated_at
	};
}

function customerShovlOutJson(customer: DbCustomer, maybeCustomerForm: DbForm | null) {
	let coreValues = {
		tenantId: customer.tenant_id,
		environmentId: customer.environment_id,
		id: customer.id,
		firstName: customer.first_name,
		lastName: customer.last_name,
		email: customer.email,
		createdAt: customer.created_at,
		updatedAt: customer.updated_at
	};
	if (maybeCustomerForm && (customer as any).customer_form_values) {
		coreValues = {
			...coreValues,
			[camelCase(maybeCustomerForm.name)]: (customer as any).customer_form_values
		};
	}
	return coreValues;
}

async function shovlOutServices(environmentId: string, prisma: PrismaClient): Promise<ShovlOutResult> {
	const lastShovlOut = await getLastShovlOut(environmentId, prisma, 'services');
	const lastShovlOutUpdate = { ...lastShovlOut, last_shovl_out: new Date() };
	const updatedServices = await prisma.services.findMany({
		where: {
			environment_id: environmentId,
			updated_at: {
				gt: lastShovlOut.last_shovl_out
			}
		}
	});
	const jsonPayloads = updatedServices.map(serviceShovlOutJson);
	return { jsonPayloads, lastShovlOutUpdate };
}

async function loadTenantForms(db: DbExpressBridge): Promise<DbForm[]> {
	return db.prisma.forms.findMany({
		where: {
			tenant_id: db.tenantEnvironment.tenantId.value,
			environment_id: db.tenantEnvironment.environmentId.value
		}
	});
}

async function getChangesSinceLastShovlOut(
	environmentId: string,
	prisma: PrismaClient
): Promise<{
	changedServices: DbService[];
	changedCustomers: DbCustomer[];
	changedBookings: DbBooking[];
	updatedShovlOuts: DbLastShovlOut[];
}> {
	const lastServicesShovlOut = await getLastShovlOut(environmentId, prisma, 'services');
	const lastServicesShovlOutUpdate = { ...lastServicesShovlOut, last_shovl_out: new Date() };
	const changedServices = await prisma.services.findMany({
		where: {
			environment_id: environmentId,
			updated_at: {
				gt: lastServicesShovlOut.last_shovl_out
			}
		}
	});
	const lastCustomersShovlOut = await getLastShovlOut(environmentId, prisma, 'customers');
	const lastCustomersShovlOutUpdate = { ...lastCustomersShovlOut, last_shovl_out: new Date() };
	const changedCustomers = await prisma.customers.findMany({
		where: {
			environment_id: environmentId,
			updated_at: {
				gt: lastCustomersShovlOut.last_shovl_out
			}
		},
		include: {
			customer_form_values: true
		}
	});
	const lastBookingsShovlOut = await getLastShovlOut(environmentId, prisma, 'bookings');
	const lastBookingsShovlOutUpdate = { ...lastBookingsShovlOut, last_shovl_out: new Date() };
	const changedBookings = await prisma.bookings.findMany({
		where: {
			environment_id: environmentId,
			updated_at: {
				gt: lastBookingsShovlOut.last_shovl_out
			}
		},
		include: {
			booking_service_form_values: true
		}
	});
	return {
		changedServices,
		changedCustomers,
		changedBookings,
		updatedShovlOuts: [lastServicesShovlOutUpdate, lastCustomersShovlOutUpdate, lastBookingsShovlOutUpdate]
	};
}

async function getChangedCustomersJson(changedCustomers: DbCustomer[], prisma: PrismaClient) {
	const tenantsWithChangedCustomers = Array.from(new Set(changedCustomers.map((customer) => customer.tenant_id)));
	const allTenantSettings = await prisma.tenant_settings.findMany({
		where: {
			tenant_id: {
				in: tenantsWithChangedCustomers
			}
		}
	});
	const allTenantForms = await prisma.forms.findMany({
		where: {
			tenant_id: {
				in: tenantsWithChangedCustomers
			}
		}
	});
	return changedCustomers.map((customer) => {
		const tenantSettings = mandatory(
			allTenantSettings.find((ts) => ts.tenant_id === customer.tenant_id && ts.environment_id === customer.environment_id),
			`No tenant settings found for tenant ${customer.tenant_id}`
		);
		const customerForm = allTenantForms.find(
			(form) => form.id === tenantSettings.customer_form_id && form.tenant_id === customer.tenant_id && form.environment_id === customer.environment_id
		);
		return customerShovlOutJson(customer, customerForm ?? null);
	});
}

async function getChangedBookingsJson(changedBookings: DbBooking[], prisma: PrismaClient) {
	const allTenantsWithChangedBookings = Array.from(new Set(changedBookings.map((booking) => booking.tenant_id)));
	const allForms = await prisma.forms.findMany({
		where: {
			tenant_id: {
				in: allTenantsWithChangedBookings
			}
		}
	});
	const allServiceForms = await prisma.service_forms.findMany({
		where: {
			tenant_id: {
				in: allTenantsWithChangedBookings
			}
		}
	});
	const jsonPayloads = changedBookings.map((booking) => {
		const formForThisService = allServiceForms
			.filter((form) => form.s_id === booking.service_id && form.tenant_id === booking.tenant_id && form.environment_id === booking.environment_id)
			.map((serviceForm) =>
				allForms.find((f) => f.id === serviceForm.form_id && f.tenant_id === booking.tenant_id && f.environment_id === booking.environment_id)
			);
		const formValues = formForThisService.reduce((acc, form) => {
			if (form) {
				acc[camelCase(form.name)] = (booking as any).booking_service_form_values.find((formValue: any) => formValue.service_form_id === form.id)
					?.service_form_values;
			}
			return acc;
		}, {} as any);
		return {
			tenantId: booking.tenant_id,
			environmentId: booking.environment_id,
			id: booking.id,
			date: booking.date,
			status: booking.status,
			serviceId: booking.service_id,
			timeSlotId: booking.time_slot_id,
			startTime24hr: booking.start_time_24hr,
			endTime24hr: booking.end_time_24hr,
			customerId: booking.customer_id,
			orderId: booking.order_id,
			createdAt: booking.created_at,
			updatedAt: booking.updated_at,
			...formValues
		};
	});
	return jsonPayloads;
}

export async function onShovlOut(req: express.Request, res: express.Response): Promise<void> {
	await withOneRequestParam(req, res, environmentIdParam(), async (environmentId) => {
		const prisma = prismaClient();
		const { changedServices, changedCustomers, changedBookings, updatedShovlOuts } = await getChangesSinceLastShovlOut(environmentId.value, prisma);
		const changedServicesJson = changedServices.map(serviceShovlOutJson);
		const changedCustomersJson = await getChangedCustomersJson(changedCustomers, prisma);
		const changedBookingsJson = await getChangedBookingsJson(changedBookings, prisma);
		res.status(200).send({ changedServicesJson, changedCustomersJson, changedBookingsJson });
	});
}
