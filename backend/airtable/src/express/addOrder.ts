import * as express from 'express';
import { orderAndTotalBody, tenantEnvironmentParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import { calcSlotPeriod, mandatory, Order, orderFns, Price, TenantEnvironment } from '@breezbook/packages-core';
import { EverythingForTenant, getEverythingForTenant } from './getEverythingForTenant.js';
import { prismaClient } from '../prisma/client.js';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { DbBooking, DbOrderLine } from '../prisma/dbtypes.js';
import { validateAvailability, validateCoupon, validateCustomerForm, validateOrderTotal, validateServiceForms } from './addOrderValidations.js';

export const addOrderErrorCodes = {
	customerFormMissing: 'addOrder.customer.form.missing',
	customerFormInvalid: 'addOrder.customer.form.invalid',
	serviceFormMissing: 'addOrder.service.form.missing',
	serviceFormInvalid: 'addOrder.service.form.invalid',
	noAvailability: 'addOrder.no.availability',
	noSuchCoupon: 'addOrder.no.such.coupon',
	expiredCoupon: 'addOrder.expired.coupon',
	wrongTotalPrice: 'addOrder.wrong.total.price'
};

async function withValidationsPerformed(
	everythingForTenant: EverythingForTenant,
	order: Order,
	orderTotal: Price,
	res: express.Response,
	fn: () => Promise<void>
) {
	const validationFns = [
		() => validateCustomerForm(everythingForTenant, order),
		() => validateServiceForms(everythingForTenant, order),
		() => validateAvailability(everythingForTenant, order),
		() => validateCoupon(everythingForTenant, order),
		() => validateOrderTotal(everythingForTenant, order, orderTotal)
	];

	for (const validationFn of validationFns) {
		const validationError = validationFn();
		if (validationError) {
			res.status(400).send(validationError);
			return;
		}
	}

	await fn();
}

async function insertOrder(tenantEnvironment: TenantEnvironment, order: Order, everythingForTenant: EverythingForTenant, res: express.Response) {
	const prisma = prismaClient();
	const tenant_id = tenantEnvironment.tenantId.value;
	const environment_id = tenantEnvironment.environmentId.value;
	const email = order.customer.email;
	const customerUpsert = prisma.customers.upsert({
		where: { tenant_id_environment_id_email: { tenant_id, environment_id, email } },
		update: { first_name: order.customer.firstName, last_name: order.customer.lastName, tenant_id },
		create: {
			email,
			first_name: order.customer.firstName,
			last_name: order.customer.lastName,
			environment_id,
			tenants: {
				connect: { tenant_id }
			}
		}
	});
	const orderId = uuidv4();
	const createOrder = prisma.orders.create({
		data: {
			id: orderId,
			environment_id,
			customers: {
				connect: { tenant_id_environment_id_email: { tenant_id, environment_id, email } }
			},
			tenants: {
				connect: { tenant_id }
			}
		}
	});
	const lineInserts: Prisma.PrismaPromise<unknown>[] = [];
	for (const line of order.lines) {
		const service = mandatory(
			everythingForTenant.businessConfiguration.services.find((s) => s.id.value === line.serviceId.value),
			`Service with id ${line.serviceId.value} not found`
		);
		const servicePeriod = calcSlotPeriod(line.slot, service.duration);
		const time_slot_id = line.slot._type === 'timeslot.spec' ? line.slot.id.value : null;
		lineInserts.push(
			prisma.order_lines.create({
				data: {
					tenant_id,
					environment_id,
					order_id: orderId,
					service_id: line.serviceId.value,
					time_slot_id: time_slot_id,
					start_time_24hr: servicePeriod.from.value,
					end_time_24hr: servicePeriod.to.value,
					add_on_ids: line.addOns.map((a) => a.addOnId.value),
					date: line.date.value
				}
			})
		);
		lineInserts.push(
			prisma.bookings.create({
				data: {
					environment_id,
					tenants: {
						connect: { tenant_id }
					},
					services: {
						connect: { id: line.serviceId.value }
					},
					orders: {
						connect: { id: orderId }
					},
					customers: {
						connect: { tenant_id_environment_id_email: { tenant_id, environment_id, email } }
					},
					time_slots: {
						connect: line.slot._type === 'timeslot.spec' ? { id: line.slot.id.value } : undefined
					},
					date: line.date.value,
					start_time_24hr: servicePeriod.from.value,
					end_time_24hr: servicePeriod.to.value
				}
			})
		);
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
		bookingIds: bookingOutcomes.map((b) => b.id),
		orderLineIds: orderLineOutcomes.map((ol) => ol.id)
	});
}

export async function addOrder(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, tenantEnvironmentParam(), orderAndTotalBody(), async (tenantEnvironment, orderAndTotal) => {
		const { fromDate, toDate } = orderFns.getOrderDateRange(orderAndTotal.order);
		const everythingForTenant = await getEverythingForTenant(tenantEnvironment, fromDate, toDate);
		await withValidationsPerformed(everythingForTenant, orderAndTotal.order, orderAndTotal.total, res, async () => {
			await insertOrder(tenantEnvironment, orderAndTotal.order, everythingForTenant, res);
		});
	});
}
