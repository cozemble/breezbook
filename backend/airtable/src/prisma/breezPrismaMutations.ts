import { PrismaCreate, PrismaUpdate, PrismaUpsert } from '../infra/prismaMutations.js';
import { Prisma, PrismaClient } from '@prisma/client';
import { Create, Update, Upsert } from '../mutation/mutations.js';

export type CreateOrder = Create<Prisma.ordersCreateArgs['data']>;
export function createOrder(data: Prisma.ordersCreateArgs['data']): CreateOrder {
	return {
		_type: 'create',
		data
	};
}
export type PrismaCreateOrder = PrismaCreate<Prisma.ordersDelegate, Prisma.ordersCreateArgs['data']>;
export type CreateBooking = Create<Prisma.bookingsCreateArgs['data']>;
export function createBooking(data: Prisma.bookingsCreateArgs['data']): CreateBooking {
	return {
		_type: 'create',
		data
	};
}
export type PrismaCreateBooking = PrismaCreate<Prisma.bookingsDelegate, Prisma.bookingsCreateArgs['data']>;
export type CreateReservation = Create<Prisma.reservationsCreateArgs['data']>;
export function createReservation(data: Prisma.reservationsCreateArgs['data']): CreateReservation {
	return {
		_type: 'create',
		data
	};
}
export type PrismaCreateReservation = PrismaCreate<Prisma.reservationsDelegate, Prisma.reservationsCreateArgs['data']>;
export type CreateOrderLine = Create<Prisma.order_linesCreateArgs['data']>;
export function createOrderLine(data: Prisma.order_linesCreateArgs['data']): CreateOrderLine {
	return {
		_type: 'create',
		data
	};
}
export type PrismaCreateOrderLine = PrismaCreate<Prisma.order_linesDelegate, Prisma.order_linesCreateArgs['data']>;
export type CreateBookingEvent = Create<Prisma.booking_eventsCreateArgs['data']>;
export function createBookingEvent(data: Prisma.booking_eventsCreateArgs['data']): CreateBookingEvent {
	return {
		_type: 'create',
		data
	};
}
export type PrismaCreateBookingEvent = PrismaCreate<Prisma.booking_eventsDelegate, Prisma.booking_eventsCreateArgs['data']>;

type PrismaUpdateCancellationGrant = PrismaUpdate<
	Prisma.cancellation_grantsDelegate,
	Prisma.cancellation_grantsUpdateArgs['data'],
	Prisma.cancellation_grantsWhereUniqueInput
>;

type UpdateBooking = Update<Prisma.bookingsUpdateArgs['data'], Prisma.bookingsWhereUniqueInput>;
type PrismaUpdateBooking = PrismaUpdate<Prisma.bookingsDelegate, Prisma.bookingsUpdateArgs['data'], Prisma.bookingsWhereUniqueInput>;

export function updateBooking(data: Prisma.bookingsUpdateArgs['data'], where: Prisma.bookingsWhereUniqueInput): UpdateBooking {
	return {
		_type: 'update',
		data,
		where
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
		create: { _type: 'create', data: create },
		update: { _type: 'update', data: update, where }
	};
}

export type PrismaUpsertCustomer = PrismaUpsert<
	Prisma.customersDelegate,
	Prisma.customersCreateArgs['data'],
	Prisma.customersUpdateArgs['data'],
	Prisma.customersUpdateArgs['where']
>;

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
		create: { _type: 'create', data: create },
		update: { _type: 'update', data: update, where }
	};
}

export type PrismaUpsertCustomerFormValues = PrismaUpsert<
	Prisma.customer_form_valuesDelegate,
	Prisma.customer_form_valuesCreateArgs['data'],
	Prisma.customer_form_valuesUpdateArgs['data'],
	Prisma.customer_form_valuesUpdateArgs['where']
>;

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
		create: { _type: 'create', data: create },
		update: { _type: 'update', data: update, where }
	};
}

export type PrismaUpsertBookingServiceFormValues = PrismaUpsert<
	Prisma.booking_service_form_valuesDelegate,
	Prisma.booking_service_form_valuesCreateArgs['data'],
	Prisma.booking_service_form_valuesUpdateArgs['data'],
	Prisma.booking_service_form_valuesUpdateArgs['where']
>;

type UpdateCancellationGrant = Update<Prisma.cancellation_grantsUpdateArgs['data'], Prisma.cancellation_grantsWhereUniqueInput>;

export function updateCancellationGrant(
	data: Prisma.cancellation_grantsUpdateArgs['data'],
	where: Prisma.cancellation_grantsWhereUniqueInput
): UpdateCancellationGrant {
	return {
		_type: 'update',
		data,
		where
	};
}

export function prismaUpdateCancellationGrant(prisma: PrismaClient, update: UpdateCancellationGrant): PrismaUpdateCancellationGrant {
	return {
		_type: 'prisma.update',
		delegate: prisma.cancellation_grants,
		update
	};
}

export function prismaUpdateBooking(prisma: PrismaClient, update: UpdateBooking): PrismaUpdateBooking {
	return {
		_type: 'prisma.update',
		delegate: prisma.bookings,
		update
	};
}

export function prismaUpsertCustomer(prisma: PrismaClient, upsert: UpsertCustomer): PrismaUpsertCustomer {
	return {
		_type: 'prisma.upsert',
		delegate: prisma.customers,
		upsert
	};
}

export function prismaUpsertCustomerFormValues(prisma: PrismaClient, upsert: UpsertCustomerFormValues): PrismaUpsertCustomerFormValues {
	return {
		_type: 'prisma.upsert',
		delegate: prisma.customer_form_values,
		upsert
	};
}

export function prismaUpsertBookingServiceFormValues(prisma: PrismaClient, upsert: UpsertBookingServiceFormValues): PrismaUpsertBookingServiceFormValues {
	return {
		_type: 'prisma.upsert',
		delegate: prisma.booking_service_form_values,
		upsert
	};
}

export function prismaCreateOrder(prisma: PrismaClient, create: CreateOrder): PrismaCreateOrder {
	return {
		_type: 'prisma.create',
		delegate: prisma.orders,
		create
	};
}

export function prismaCreateBooking(prisma: PrismaClient, create: CreateBooking): PrismaCreateBooking {
	return {
		_type: 'prisma.create',
		delegate: prisma.bookings,
		create
	};
}

export function prismaCreateReservation(prisma: PrismaClient, create: CreateReservation): PrismaCreateReservation {
	return {
		_type: 'prisma.create',
		delegate: prisma.reservations,
		create
	};
}

export function prismaCreateOrderLine(prisma: PrismaClient, create: CreateOrderLine): PrismaCreateOrderLine {
	return {
		_type: 'prisma.create',
		delegate: prisma.order_lines,
		create
	};
}

export function prismaCreateBookingEvent(prisma: PrismaClient, create: CreateBookingEvent): PrismaCreateBookingEvent {
	return {
		_type: 'prisma.create',
		delegate: prisma.booking_events,
		create
	};
}
