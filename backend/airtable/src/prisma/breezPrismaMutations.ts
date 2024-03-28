import { Prisma } from '@prisma/client';
import { Create, Update, Upsert } from '../mutation/mutations.js';

export type CreateOrder = Create<Prisma.ordersCreateArgs['data']>;
export function createOrder(data: Prisma.ordersCreateArgs['data']): CreateOrder {
	return {
		_type: 'create',
		data,
		entity: 'orders'
	};
}
export type CreateBooking = Create<Prisma.bookingsCreateArgs['data']>;
export function createBooking(data: Prisma.bookingsCreateArgs['data']): CreateBooking {
	return {
		_type: 'create',
		data,
		entity: 'bookings'
	};
}
export type CreateReservation = Create<Prisma.reservationsCreateArgs['data']>;
export function createReservation(data: Prisma.reservationsCreateArgs['data']): CreateReservation {
	return {
		_type: 'create',
		data,
		entity: 'reservations'
	};
}
export type CreateOrderLine = Create<Prisma.order_linesCreateArgs['data']>;
export function createOrderLine(data: Prisma.order_linesCreateArgs['data']): CreateOrderLine {
	return {
		_type: 'create',
		data,
		entity: 'order_lines'
	};
}
export type CreateBookingEvent = Create<Prisma.booking_eventsCreateArgs['data']>;
export function createBookingEvent(data: Prisma.booking_eventsCreateArgs['data']): CreateBookingEvent {
	return {
		_type: 'create',
		data,
		entity: 'booking_events'
	};
}
type UpdateBooking = Update<Prisma.bookingsUpdateArgs['data'], Prisma.bookingsWhereUniqueInput>;

export function updateBooking(data: Prisma.bookingsUpdateArgs['data'], where: Prisma.bookingsWhereUniqueInput): UpdateBooking {
	return {
		_type: 'update',
		data,
		where,
		entity: 'bookings'
	};
}

export type UpsertCustomer = Upsert<Prisma.customersCreateArgs['data'], Prisma.customersUpdateArgs['data'], Prisma.customersUpdateArgs['where']>;
export function upsertCustomer(
	create: Prisma.customersCreateArgs['data'],
	update: Prisma.customersUpdateArgs['data'],
	where: Prisma.customersWhereUniqueInput
): UpsertCustomer {
	return {
		_type: 'upsert',
		create: { _type: 'create', data: create, entity: 'customers' },
		update: { _type: 'update', data: update, where, entity: 'customers' }
	};
}

export type UpsertCustomerFormValues = Upsert<
	Prisma.customer_form_valuesCreateArgs['data'],
	Prisma.customer_form_valuesUpdateArgs['data'],
	Prisma.customer_form_valuesUpdateArgs['where']
>;

export function upsertCustomerFormValues(
	create: Prisma.customer_form_valuesCreateArgs['data'],
	update: Prisma.customer_form_valuesUpdateArgs['data'],
	where: Prisma.customer_form_valuesWhereUniqueInput
): UpsertCustomerFormValues {
	return {
		_type: 'upsert',
		create: { _type: 'create', data: create, entity: 'customer_form_values' },
		update: { _type: 'update', data: update, where, entity: 'customer_form_values' }
	};
}

export type UpsertBookingServiceFormValues = Upsert<
	Prisma.booking_service_form_valuesCreateArgs['data'],
	Prisma.booking_service_form_valuesUpdateArgs['data'],
	Prisma.booking_service_form_valuesUpdateArgs['where']
>;

export function upsertBookingServiceFormValues(
	create: Prisma.booking_service_form_valuesCreateArgs['data'],
	update: Prisma.booking_service_form_valuesUpdateArgs['data'],
	where: Prisma.booking_service_form_valuesWhereUniqueInput
): UpsertBookingServiceFormValues {
	return {
		_type: 'upsert',
		create: { _type: 'create', data: create, entity: 'booking_service_form_values' },
		update: { _type: 'update', data: update, where, entity: 'booking_service_form_values' }
	};
}

type UpdateCancellationGrant = Update<Prisma.cancellation_grantsUpdateArgs['data'], Prisma.cancellation_grantsWhereUniqueInput>;

export function updateCancellationGrant(
	data: Prisma.cancellation_grantsUpdateArgs['data'],
	where: Prisma.cancellation_grantsWhereUniqueInput
): UpdateCancellationGrant {
	return {
		_type: 'update',
		data,
		where,
		entity: 'cancellation_grants'
	};
}
