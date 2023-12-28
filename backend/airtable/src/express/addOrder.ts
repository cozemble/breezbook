import * as express from 'express';
import { orderBody, tenantIdParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import {
	booking,
	Booking, bookingId,
	calcSlotPeriod,
	calculateAvailability, customerId, DayAndTimePeriod,
	Form,
	FormId,
	mandatory,
	Order,
	orderFns,
	TenantId
} from '@breezbook/packages-core';
import { EverythingForTenant, getEverythingForTenant } from './getEverythingForTenant.js';
import { prismaClient } from '../prisma/client.js';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { DbBooking, DbOrderLine } from '../prisma/dbtypes.js';
import { errorResponse } from '../apiTypes.js';
import Ajv from 'ajv';
import {
	applyBookingsToResourceAvailability
} from '@breezbook/packages-core/dist/applyBookingsToResourceAvailability.js';

// @ts-ignore
const ajv = new Ajv({ allErrors: true });

export const addOrderErrorCodes = {
	customerFormMissing: 'addOrder.customer.form.missing',
	customerFormInvalid: 'addOrder.customer.form.invalid',
	serviceFormMissing: 'addOrder.service.form.missing',
	serviceFormInvalid: 'addOrder.service.form.invalid',
	noAvailability: 'addOrder.no.availability'
};

function validateForm(forms: Form[], formId: FormId, formData: unknown): string | null {
	const form = mandatory(forms.find(f => f.id.value === formId.value), `Form with id ${formId.value} not found`);
	if (form._type === 'json.schema.form') {
		const validate = ajv.compile(form.schema);
		const valid = validate(formData);
		if (!valid) {
			return ajv.errorsText(validate.errors);
		}
		return null;
	} else {
		throw new Error(`Form type ${form._type} not supported`);
	}
}

async function withValidationsPerformed(everythingForTenant: EverythingForTenant, order: Order, res: express.Response, fn: () => Promise<void>) {
	if (everythingForTenant.tenantSettings.customerFormId) {
		if (!order.customer.formData) {
			res.status(400).send(errorResponse(addOrderErrorCodes.customerFormMissing));
			return;
		} else {
			const formValidationError = validateForm(everythingForTenant.businessConfiguration.forms, everythingForTenant.tenantSettings.customerFormId, order.customer.formData);
			if (formValidationError) {
				res.status(400).send(errorResponse(addOrderErrorCodes.customerFormInvalid, formValidationError));
				return;
			}
		}
	}
	for (let i = 0; i < order.lines.length; i++) {
		const line = order.lines[i];
		const service = mandatory(everythingForTenant.businessConfiguration.services.find(s => s.id.value === line.serviceId.value), `Service with id ${line.serviceId.value} not found`);
		for (let serviceFormIndex = 0; serviceFormIndex < service.serviceFormIds.length; serviceFormIndex++) {
			const serviceFormId = service.serviceFormIds[serviceFormIndex];
			const formData = line.serviceFormData[serviceFormIndex] as unknown;
			if (!formData) {
				res.status(400).send(errorResponse(addOrderErrorCodes.serviceFormMissing, `Service form ${serviceFormId.value} missing in order line ${i}`));
				return;
			}
			const formValidationError = validateForm(everythingForTenant.businessConfiguration.forms, serviceFormId, formData);
			if (formValidationError) {
				res.status(400).send(errorResponse(addOrderErrorCodes.serviceFormInvalid, formValidationError + ` for service ${service.name} in order line ${i}`));
				return;
			}
		}
	}
	const projectedBookings:Booking[] = [...everythingForTenant.bookings]
	for (let i = 0; i < order.lines.length; i++) {
		const line = order.lines[i];
		const projectedBooking = booking(order.customer.id, line.serviceId, line.date, line.slot);
		projectedBookings.push(projectedBooking);
		try {
			applyBookingsToResourceAvailability(everythingForTenant.businessConfiguration.resourceAvailability, projectedBookings, everythingForTenant.businessConfiguration.services);
		} catch (e:unknown) {
			res.status(400).send(errorResponse(addOrderErrorCodes.noAvailability, (e as Error).message + ` for service ${line.serviceId.value} in order line ${i}`));
			return;
		}
	}

	await fn();
}

async function insertOrder(tenantId: TenantId, order: Order, everythingForTenant: EverythingForTenant, res: express.Response) {
	const prisma = prismaClient();
	const tenant_id = tenantId.value;
	const email = order.customer.email;
	const customerUpsert = prisma.customers.upsert({
		where: { tenant_id_email: { tenant_id: tenantId.value, email } },
		update: { first_name: order.customer.firstName, last_name: order.customer.lastName, tenant_id },
		create: {
			email, first_name: order.customer.firstName, last_name: order.customer.lastName, tenants: {
				connect: { tenant_id: tenantId.value }
			}
		}
	});
	const orderId = uuidv4();
	const createOrder = prisma.orders.create({
		data: {
			id: orderId,
			customers: {
				connect: { tenant_id_email: { tenant_id, email } }
			},
			tenants: {
				connect: { tenant_id: tenantId.value }
			}

		}
	});
	const lineInserts: Prisma.PrismaPromise<unknown>[] = [];
	for (const line of order.lines) {
		const service = mandatory(everythingForTenant.businessConfiguration.services.find(s => s.id.value === line.serviceId.value), `Service with id ${line.serviceId.value} not found`);
		const servicePeriod = calcSlotPeriod(line.slot, service.duration);
		const time_slot_id = line.slot._type === 'timeslot.spec' ? line.slot.id.value : null;
		lineInserts.push(prisma.order_lines.create({
			data: {
				tenant_id: tenantId.value,
				order_id: orderId,
				service_id: line.serviceId.value,
				time_slot_id: time_slot_id,
				start_time_24hr: servicePeriod.from.value,
				end_time_24hr: servicePeriod.to.value,
				add_on_ids: line.addOnIds.map(a => a.value),
				date: line.date.value
			}
		}));
		lineInserts.push(prisma.bookings.create({
			data: {
				tenants: {
					connect: { tenant_id: tenantId.value }
				},
				services: {
					connect: { id: line.serviceId.value }
				},
				orders: {
					connect: { id: orderId }
				},
				customers: {
					connect: { tenant_id_email: { tenant_id, email } }
				},
				time_slots: {
					connect: line.slot._type === 'timeslot.spec' ? { id: line.slot.id.value } : undefined,
				},
				date: line.date.value,
				start_time_24hr: servicePeriod.from.value,
				end_time_24hr: servicePeriod.to.value,
			}
		}));
	}
	const [customerOutcome, orderOutcome, ...remainingOutcomes] = await prisma.$transaction([customerUpsert, createOrder, ...lineInserts]);
	const orderLineOutcomes: DbOrderLine[] = [];
	const bookingOutcomes: DbBooking[] = [];

	for (let i = 0; i < remainingOutcomes.length; i++) {
		if (i % 2 == 0) {
			orderLineOutcomes.push(remainingOutcomes[i] as DbOrderLine);
		} else {
			bookingOutcomes.push(remainingOutcomes[i] as DbBooking);
		}
	}


	res.send({
		orderId: orderOutcome.id,
		customerId: customerOutcome.id,
		bookingIds: bookingOutcomes.map(b => b.id),
		orderLineIds: orderLineOutcomes.map(ol => ol.id)
	});
}

export async function addOrder(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, tenantIdParam(), orderBody(), async (tenantId, order) => {
		const { fromDate, toDate } = orderFns.getOrderDateRange(order);
		const everythingForTenant = await getEverythingForTenant(tenantId, fromDate, toDate);
		await withValidationsPerformed(everythingForTenant, order, res, async () => {
			await insertOrder(tenantId, order, everythingForTenant, res);
		});
	});
}

