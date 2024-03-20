import { PrismaCreate, PrismaUpdate, PrismaUpsert } from '../infra/prismaMutations.js';
import { Prisma, PrismaClient } from '@prisma/client';

export type CreateOrder = PrismaCreate<Prisma.ordersDelegate, Prisma.ordersCreateArgs['data']>;
export type CreateBooking = PrismaCreate<Prisma.bookingsDelegate, Prisma.bookingsCreateArgs['data']>;
export type CreateReservation = PrismaCreate<Prisma.reservationsDelegate, Prisma.reservationsCreateArgs['data']>;
export type CreateOrderLine = PrismaCreate<Prisma.order_linesDelegate, Prisma.order_linesCreateArgs['data']>;
export type CreateBookingEvent = PrismaCreate<Prisma.booking_eventsDelegate, Prisma.booking_eventsCreateArgs['data']>;

type UpdateCancellationGrant = PrismaUpdate<
	Prisma.cancellation_grantsDelegate,
	Prisma.cancellation_grantsUpdateArgs['data'],
	Prisma.cancellation_grantsWhereUniqueInput
>;

type UpdateBooking = PrismaUpdate<Prisma.bookingsDelegate, Prisma.bookingsUpdateArgs['data'], Prisma.bookingsWhereUniqueInput>;

export type UpsertCustomer = PrismaUpsert<
	Prisma.customersDelegate,
	Prisma.customersCreateArgs['data'],
	Prisma.customersUpdateArgs['data'],
	Prisma.customersUpdateArgs['where']
>;

export type UpsertCustomerFormValues = PrismaUpsert<
	Prisma.customer_form_valuesDelegate,
	Prisma.customer_form_valuesCreateArgs['data'],
	Prisma.customer_form_valuesUpdateArgs['data'],
	Prisma.customer_form_valuesUpdateArgs['where']
>;

export type UpsertBookingServiceFormValues = PrismaUpsert<
	Prisma.booking_service_form_valuesDelegate,
	Prisma.booking_service_form_valuesCreateArgs['data'],
	Prisma.booking_service_form_valuesUpdateArgs['data'],
	Prisma.booking_service_form_valuesUpdateArgs['where']
>;

export function updateCancellationGrant(
	prisma: PrismaClient,
	data: Prisma.cancellation_grantsUpdateArgs['data'],
	where: Prisma.cancellation_grantsWhereUniqueInput
): UpdateCancellationGrant {
	return {
		_type: 'prisma.update',
		delegate: prisma.cancellation_grants,
		data: data,
		where: where
	};
}

export function updateBooking(prisma: PrismaClient, data: Prisma.bookingsUpdateArgs['data'], where: Prisma.bookingsWhereUniqueInput): UpdateBooking {
	return {
		_type: 'prisma.update',
		delegate: prisma.bookings,
		data: data,
		where: where
	};
}

export function upsertCustomer(
	prisma: PrismaClient,
	create: Prisma.customersCreateArgs['data'],
	update: Prisma.customersUpdateArgs['data'],
	where: Prisma.customersWhereUniqueInput
): UpsertCustomer {
	return {
		_type: 'prisma.upsert',
		delegate: prisma.customers,
		where,
		update,
		create
	};
}

export function upsertCustomerFormValues(
	prisma: PrismaClient,
	create: Prisma.customer_form_valuesCreateArgs['data'],
	update: Prisma.customer_form_valuesUpdateArgs['data'],
	where: Prisma.customer_form_valuesWhereUniqueInput
): UpsertCustomerFormValues {
	return {
		_type: 'prisma.upsert',
		delegate: prisma.customer_form_values,
		where,
		update,
		create
	};
}

export function upsertBookingServiceFormValues(
	prisma: PrismaClient,
	create: Prisma.booking_service_form_valuesCreateArgs['data'],
	update: Prisma.booking_service_form_valuesUpdateArgs['data'],
	where: Prisma.booking_service_form_valuesWhereUniqueInput
): UpsertBookingServiceFormValues {
	return {
		_type: 'prisma.upsert',
		delegate: prisma.booking_service_form_values,
		where,
		update,
		create
	};
}

export function createOrder(prisma: PrismaClient, data: Prisma.ordersCreateArgs['data']): CreateOrder {
	return {
		_type: 'prisma.create',
		delegate: prisma.orders,
		data
	};
}

export function createBooking(prisma: PrismaClient, data: Prisma.bookingsCreateArgs['data']): CreateBooking {
	return {
		_type: 'prisma.create',
		delegate: prisma.bookings,
		data
	};
}

export function createReservation(prisma: PrismaClient, data: Prisma.reservationsCreateArgs['data']): CreateReservation {
	return {
		_type: 'prisma.create',
		delegate: prisma.reservations,
		data
	};
}

export function createOrderLine(prisma: PrismaClient, data: Prisma.order_linesCreateArgs['data']): CreateOrderLine {
	return {
		_type: 'prisma.create',
		delegate: prisma.order_lines,
		data
	};
}

export function createBookingEvent(prisma: PrismaClient, data: Prisma.booking_eventsCreateArgs['data']): CreateBookingEvent {
	return {
		_type: 'prisma.create',
		delegate: prisma.booking_events,
		data
	};
}
