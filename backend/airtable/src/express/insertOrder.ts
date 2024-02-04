import { calcSlotPeriod, mandatory, Order, Service, TenantEnvironment } from '@breezbook/packages-core';
import { CreateOrderRequest, orderCreatedResponse, OrderCreatedResponse } from '@breezbook/backend-api-types';
import { prismaClient } from '../prisma/client.js';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { PrismaMutation, prismaMutations, PrismaMutations, prismaMutationToPromise } from '../infra/prismaMutations.js';
import {
	createBooking,
	CreateOrder,
	createOrder as createOrderMutation,
	createOrderLine,
	createReservation,
	upsertCustomer as upsertCustomerMutation,
	UpsertCustomer
} from '../prisma/breezPrismaMutations.js';

function upsertCustomer(prisma: PrismaClient, tenantEnvironment: TenantEnvironment, order: Order): UpsertCustomer {
	const tenant_id = tenantEnvironment.tenantId.value;
	const environment_id = tenantEnvironment.environmentId.value;
	const email = order.customer.email.value;
	return upsertCustomerMutation(
		prisma,
		{
			id: order.customer.id.value,
			email,
			first_name: order.customer.firstName,
			last_name: order.customer.lastName,
			environment_id,
			tenants: {
				connect: { tenant_id }
			}
		},
		{
			first_name: order.customer.firstName,
			last_name: order.customer.lastName,
			tenant_id
		},
		{ tenant_id_environment_id_email: { tenant_id, environment_id, email } }
	);
}

function createOrder(prisma: PrismaClient, tenantEnvironment: TenantEnvironment, createOrderRequest: CreateOrderRequest, orderId: string): CreateOrder {
	const tenant_id = tenantEnvironment.tenantId.value;
	const environment_id = tenantEnvironment.environmentId.value;
	const email = createOrderRequest.order.customer.email.value;
	return createOrderMutation(prisma, {
		id: orderId,
		environment_id,
		total_price_in_minor_units: createOrderRequest.orderTotal.amount.value,
		total_price_currency: createOrderRequest.orderTotal.currency.value,
		customers: {
			connect: { tenant_id_environment_id_email: { tenant_id, environment_id, email } }
		},
		tenants: {
			connect: { tenant_id }
		}
	});
}

function processOrderLines(
	prisma: PrismaClient,
	tenantEnvironment: TenantEnvironment,
	createOrderRequest: CreateOrderRequest,
	orderId: string,
	services: Service[]
): { prismaMutations: PrismaMutation[]; bookingIds: string[]; reservationIds: string[]; orderLineIds: string[] } {
	const tenant_id = tenantEnvironment.tenantId.value;
	const environment_id = tenantEnvironment.environmentId.value;
	const order = createOrderRequest.order;
	const email = createOrderRequest.order.customer.email.value;

	const prismaMutations: PrismaMutation[] = [];
	const shouldMakeReservations =
		createOrderRequest.paymentIntent._type === 'full.payment.on.checkout' || createOrderRequest.paymentIntent._type === 'deposit.and.balance';
	const orderLineIds = [] as string[];
	const reservationIds = [] as string[];
	const bookingIds = [] as string[];
	for (const line of order.lines) {
		const service = mandatory(
			services.find((s) => s.id.value === line.serviceId.value),
			`Service with id ${line.serviceId.value} not found`
		);
		const servicePeriod = calcSlotPeriod(line.slot, service.duration);
		const time_slot_id = line.slot._type === 'timeslot.spec' ? line.slot.id.value : null;
		const orderLineId = uuidv4();
		orderLineIds.push(orderLineId);

		prismaMutations.push(
			createOrderLine(prisma, {
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
			})
		);
		const bookingId = uuidv4();
		bookingIds.push(bookingId);
		prismaMutations.push(
			createBooking(prisma, {
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
			})
		);
		if (shouldMakeReservations) {
			const reservationId = uuidv4();
			reservationIds.push(reservationId);
			prismaMutations.push(
				createReservation(prisma, {
					id: reservationId,
					bookings: {
						connect: { id: bookingId }
					},
					reservation_time: new Date(),
					expiry_time: new Date(new Date().getTime() + 1000 * 60 * 30),
					reservation_type: 'awaiting payment'
				})
			);
		}
	}
	return { prismaMutations, bookingIds, reservationIds, orderLineIds };
}

export function doInsertOrder(
	tenantEnvironment: TenantEnvironment,
	createOrderRequest: CreateOrderRequest,
	services: Service[]
): { _type: 'success'; prismaMutations: PrismaMutations; orderCreatedResponse: OrderCreatedResponse } {
	const prisma = prismaClient();
	const orderId = uuidv4();
	const order = createOrderRequest.order;
	const {
		prismaMutations: orderLineMutations,
		bookingIds,
		reservationIds,
		orderLineIds
	} = processOrderLines(prisma, tenantEnvironment, createOrderRequest, orderId, services);
	const mutations = [
		upsertCustomer(prisma, tenantEnvironment, order),
		createOrder(prisma, tenantEnvironment, createOrderRequest, orderId),
		...orderLineMutations
	];
	return {
		_type: 'success',
		prismaMutations: prismaMutations(mutations),
		orderCreatedResponse: orderCreatedResponse(orderId, order.customer.id.value, bookingIds, reservationIds, orderLineIds)
	};
}

export async function insertOrder(
	tenantEnvironment: TenantEnvironment,
	createOrderRequest: CreateOrderRequest,
	services: Service[]
): Promise<OrderCreatedResponse> {
	const { prismaMutations, orderCreatedResponse } = doInsertOrder(tenantEnvironment, createOrderRequest, services);
	const prisma = prismaClient();
	await prisma.$transaction(prismaMutations.mutations.map(prismaMutationToPromise));
	return orderCreatedResponse;
}
