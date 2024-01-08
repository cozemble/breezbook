import * as express from 'express';
import { createOrderRequest, tenantEnvironmentParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import { calcSlotPeriod, mandatory, Order, orderFns, Price, TenantEnvironment } from '@breezbook/packages-core';
import { EverythingForTenant, getEverythingForTenant } from './getEverythingForTenant.js';
import { prismaClient } from '../prisma/client.js';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { DbBooking, DbOrderLine } from '../prisma/dbtypes.js';
import { validateAvailability, validateCoupon, validateCustomerForm, validateOrderTotal, validateServiceForms } from './addOrderValidations.js';
import { CreateOrderRequest, orderCreatedResponse } from '@breezbook/backend-api-types';

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

async function insertOrder(
	tenantEnvironment: TenantEnvironment,
	createOrderRequest: CreateOrderRequest,
	everythingForTenant: EverythingForTenant,
	res: express.Response
) {
	const order = createOrderRequest.order;
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
	const shouldMakeReservations =
		createOrderRequest.paymentIntent._type === 'full.payment.on.checkout' || createOrderRequest.paymentIntent._type === 'deposit.and.balance';
	const orderLineIds = [] as string[];
	const reservationIds = [] as string[];
	const bookingIds = [] as string[];
	for (const line of order.lines) {
		const service = mandatory(
			everythingForTenant.businessConfiguration.services.find((s) => s.id.value === line.serviceId.value),
			`Service with id ${line.serviceId.value} not found`
		);
		const servicePeriod = calcSlotPeriod(line.slot, service.duration);
		const time_slot_id = line.slot._type === 'timeslot.spec' ? line.slot.id.value : null;
		const orderLineId = uuidv4();
		orderLineIds.push(orderLineId);

		lineInserts.push(
			prisma.order_lines.create({
				data: {
					id: orderLineId,
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
		const bookingId = uuidv4();
		bookingIds.push(bookingId);
		lineInserts.push(
			prisma.bookings.create({
				data: {
					id: bookingId,
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
		if (shouldMakeReservations) {
			const reservationId = uuidv4();
			reservationIds.push(reservationId);
			lineInserts.push(
				prisma.reservations.create({
					data: {
						id: reservationId,
						bookings: {
							connect: { id: bookingId }
						},
						reservation_time: new Date(),
						expiry_time: new Date(new Date().getTime() + 1000 * 60 * 30),
						reservation_type: 'awaiting payment'
					}
				})
			);
		}
	}
	const [customerOutcome, orderOutcome, ...remainingOutcomes] = await prisma.$transaction([customerUpsert, createOrder, ...lineInserts]);

	res.send(orderCreatedResponse(orderOutcome.id, customerOutcome.id, bookingIds, reservationIds, orderLineIds));
}

export async function addOrder(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, tenantEnvironmentParam(), createOrderRequest(), async (tenantEnvironment, createOrderRequest) => {
		const { fromDate, toDate } = orderFns.getOrderDateRange(createOrderRequest.order);
		const everythingForTenant = await getEverythingForTenant(tenantEnvironment, fromDate, toDate);
		await withValidationsPerformed(everythingForTenant, createOrderRequest.order, createOrderRequest.orderTotal, res, async () => {
			await insertOrder(tenantEnvironment, createOrderRequest, everythingForTenant, res);
		});
	});
}
