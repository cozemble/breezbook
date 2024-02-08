import { carwash, fullPaymentOnCheckout, IsoDate, isoDate, isoDateFns, mandatory, order, orderLine, SystemClock } from '@breezbook/packages-core';
import { describe, expect, test } from 'vitest';
import { insertOrder } from '../src/express/insertOrder.js';
import { CancellationGranted, createOrderRequest } from '@breezbook/backend-api-types';
import { goodCustomer } from './helper.js';
import { doCancellationRequest, doCommitCancellation } from '../src/express/cancellation.js';
import { prismaClient } from '../src/prisma/client.js';
import { DbBooking, DbCancellationGrant } from '../src/prisma/dbtypes.js';
import { prismaMutations } from '../src/infra/prismaMutations.js';
import { updateBooking, updateCancellationGrant } from '../src/prisma/breezPrismaMutations.js';
import { jsDateFns } from '@breezbook/packages-core/dist/jsDateFns.js';
import { HttpError } from '../src/infra/functionalExpress.js';

test("can't get a cancellation grant for a booking in the past", () => {
	const theBooking = makeDbBooking(isoDateFns.addDays(isoDate(), -1));
	const outcome = doCancellationRequest([], [], theBooking, new SystemClock()) as HttpError;
	expect(outcome._type).toBe('http.error');
	expect(outcome.status).toBe(400);
});

test('full refund if there are no refund rules, and booking is in the future', () => {
	const theBooking = makeDbBooking(isoDateFns.addDays(isoDate(), 1));
	const outcome = doCancellationRequest([], [], theBooking, new SystemClock()) as CancellationGranted;
	expect(outcome._type).toBe('cancellation.granted');
	expect(outcome.refundPercentageAsRatio).toBe(1.0);
});

function makeDbBooking(yesterday: IsoDate) {
	const theBooking: DbBooking = {
		id: 'booking-id',
		environment_id: 'environment-id',
		tenant_id: 'tenant-id',
		created_at: new Date(),
		updated_at: new Date(),
		date: yesterday.value,
		status: 'confirmed',
		service_id: 'service-id',
		time_slot_id: null,
		start_time_24hr: '09:00',
		end_time_24hr: '10:00',
		customer_id: 'customer-id',
		order_id: 'order-id'
	};
	return theBooking;
}

describe('Given a cancellation grant', () => {
	const prisma = prismaClient();
	const cancellation: DbCancellationGrant = {
		id: 'cancellation-id',
		environment_id: 'environment-id',
		tenant_id: 'tenant-id',
		booking_id: 'booking-id',
		committed: false,
		created_at: new Date(),
		updated_at: new Date(),
		definition: {
			_type: 'cancellation.granted'
		}
	};
	test('can commit it and cancel the booking', () => {
		const outcome = doCommitCancellation(prisma, cancellation, new SystemClock());
		expect(outcome).toEqual(
			prismaMutations([
				updateCancellationGrant(prisma, { committed: true }, { id: cancellation.id }),
				updateBooking(prisma, { status: 'cancelled' }, { id: cancellation.booking_id })
			])
		);
	});
	test('returns error if already committed', () => {
		const outcome = doCommitCancellation(prisma, { ...cancellation, committed: true }, new SystemClock());
		expect(outcome._type).toBe('http.error');
	});
	test('returns error if grant is too old', () => {
		const outcome = doCommitCancellation(
			prisma,
			{
				...cancellation,
				created_at: jsDateFns.addHours(new Date(), -1)
			},
			new SystemClock()
		);
		expect(outcome._type).toBe('http.error');
	});
});

async function createBooking(date: IsoDate): Promise<string> {
	const createOrderResponse = await insertOrder(
		tenantEnv,
		createOrderRequest(
			order(goodCustomer, [orderLine(carwash.mediumCarWash.id, carwash.mediumCarWash.price, [], date, carwash.nineToOne, [])]),
			carwash.mediumCarWash.price,
			fullPaymentOnCheckout()
		),
		carwash.services
	);
	expect(createOrderResponse.bookingIds).toHaveLength(1);
	expect(createOrderResponse.bookingIds[0]).toBeDefined();
	return mandatory(createOrderResponse.bookingIds[0], 'Booking id is not defined');
}
