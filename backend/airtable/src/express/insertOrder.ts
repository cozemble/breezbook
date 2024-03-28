import { calcSlotPeriod, FormId, mandatory, Order, Service, TenantEnvironment, TenantSettings } from '@breezbook/packages-core';
import { CreateOrderRequest, orderCreatedResponse, OrderCreatedResponse } from '@breezbook/backend-api-types';
import { prismaClient } from '../prisma/client.js';
import { v4 as uuidv4 } from 'uuid';
import { Prisma, PrismaClient } from '@prisma/client';
import { prismaMutationToPromise } from '../infra/prismaMutations.js';
import {
	createBooking,
	createOrder,
	createReservation,
	upsertBookingServiceFormValues,
	upsertCustomer,
	upsertCustomerFormValues,
	createOrderLine,
	CreateOrder,
	UpsertBookingServiceFormValues
} from '../prisma/breezPrismaMutations.js';
import { Mutation, Mutations, mutations as mutationsConstructor } from '../mutation/mutations.js';

function upsertCustomerAsPrismaMutations(prisma: PrismaClient, tenantEnvironment: TenantEnvironment, order: Order, tenantSettings: TenantSettings): Mutation[] {
	const tenant_id = tenantEnvironment.tenantId.value;
	const environment_id = tenantEnvironment.environmentId.value;
	const email = order.customer.email.value;
	const upserts: Mutation[] = [
		upsertCustomer(
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
		)
	];
	if (tenantSettings.customerFormId && order.customer.formData) {
		const create: Prisma.customer_form_valuesCreateArgs['data'] = {
			environment_id: tenantEnvironment.environmentId.value,
			tenants: {
				connect: { tenant_id }
			},
			form_values: order.customer.formData,
			customers: {
				connect: {
					tenant_id_environment_id_email: { tenant_id, environment_id, email }
				}
			}
		};
		const update: Prisma.customer_form_valuesUpdateArgs['data'] = {
			form_values: order.customer.formData
		};
		const where: Prisma.customer_form_valuesWhereUniqueInput = {
			tenant_id_environment_id_customer_id: { tenant_id, environment_id, customer_id: order.customer.id.value }
		};

		upserts.push(upsertCustomerFormValues(create, update, where));
	}
	return upserts;
}

function createOrderAsPrismaMutation(tenantEnvironment: TenantEnvironment, createOrderRequest: CreateOrderRequest, orderId: string): CreateOrder {
	const tenant_id = tenantEnvironment.tenantId.value;
	const environment_id = tenantEnvironment.environmentId.value;
	const email = createOrderRequest.order.customer.email.value;
	return createOrder({
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

function upsertServiceFormValues(
	prisma: PrismaClient,
	tenantEnvironment: TenantEnvironment,
	serviceFormId: FormId,
	serviceFormData: unknown,
	bookingId: string
): UpsertBookingServiceFormValues {
	const create: Prisma.booking_service_form_valuesCreateArgs['data'] = {
		environment_id: tenantEnvironment.environmentId.value,
		tenants: {
			connect: { tenant_id: tenantEnvironment.tenantId.value }
		},
		service_form_values: serviceFormData as any,
		forms: {
			connect: { id: serviceFormId.value }
		},
		bookings: {
			connect: { id: bookingId }
		}
	};
	const update: Prisma.booking_service_form_valuesUpdateArgs['data'] = {
		service_form_values: serviceFormData as any
	};
	const where: Prisma.booking_service_form_valuesWhereUniqueInput = {
		tenant_id_environment_id_booking_id_service_form_id: {
			tenant_id: tenantEnvironment.tenantId.value,
			environment_id: tenantEnvironment.environmentId.value,
			service_form_id: serviceFormId.value,
			booking_id: bookingId
		}
	};
	return upsertBookingServiceFormValues(create, update, where);
}

function processOrderLines(
	prisma: PrismaClient,
	tenantEnvironment: TenantEnvironment,
	createOrderRequest: CreateOrderRequest,
	orderId: string,
	services: Service[]
): { mutations: Mutation[]; bookingIds: string[]; reservationIds: string[]; orderLineIds: string[] } {
	const tenant_id = tenantEnvironment.tenantId.value;
	const environment_id = tenantEnvironment.environmentId.value;
	const order = createOrderRequest.order;
	const email = createOrderRequest.order.customer.email.value;

	const mutations: Mutation[] = [];
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

		mutations.push(
			createOrderLine({
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
		mutations.push(
			createBooking({
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
			mutations.push(
				createReservation({
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
		for (let serviceFormIndex = 0; serviceFormIndex < service.serviceFormIds.length; serviceFormIndex++) {
			mutations.push(
				upsertServiceFormValues(prisma, tenantEnvironment, service.serviceFormIds[serviceFormIndex], line.serviceFormData[serviceFormIndex], bookingId)
			);
		}
	}
	return { mutations, bookingIds, reservationIds, orderLineIds };
}

export function doInsertOrder(
	tenantEnvironment: TenantEnvironment,
	createOrderRequest: CreateOrderRequest,
	services: Service[],
	tenantSettings: TenantSettings
): { _type: 'success'; mutations: Mutations; orderCreatedResponse: OrderCreatedResponse } {
	const prisma = prismaClient();
	const orderId = uuidv4();
	const order = createOrderRequest.order;
	const {
		mutations: orderLineMutations,
		bookingIds,
		reservationIds,
		orderLineIds
	} = processOrderLines(prisma, tenantEnvironment, createOrderRequest, orderId, services);
	const mutations = [
		...upsertCustomerAsPrismaMutations(prisma, tenantEnvironment, order, tenantSettings),
		createOrderAsPrismaMutation(tenantEnvironment, createOrderRequest, orderId),
		...orderLineMutations
	];
	return {
		_type: 'success',
		mutations: mutationsConstructor(mutations),
		orderCreatedResponse: orderCreatedResponse(orderId, order.customer.id.value, bookingIds, reservationIds, orderLineIds)
	};
}

export async function insertOrder(
	tenantEnvironment: TenantEnvironment,
	createOrderRequest: CreateOrderRequest,
	services: Service[],
	tenantSettings: TenantSettings
): Promise<OrderCreatedResponse> {
	const { mutations, orderCreatedResponse } = doInsertOrder(tenantEnvironment, createOrderRequest, services, tenantSettings);
	const prisma = prismaClient();
	await prisma.$transaction(mutations.mutations.map((mutation) => prismaMutationToPromise(prisma, mutation)));
	return orderCreatedResponse;
}
