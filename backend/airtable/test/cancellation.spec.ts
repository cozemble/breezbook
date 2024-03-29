import { IsoDate, isoDate, isoDateFns, SystemClock } from '@breezbook/packages-core';
import { describe, expect, test } from 'vitest';
import { CancellationGranted } from '@breezbook/backend-api-types';
import { doCancellationRequest, doCommitCancellation } from '../src/express/cancellation.js';
import { DbBooking, DbCancellationGrant } from '../src/prisma/dbtypes.js';
import { createBookingEvent, updateBooking, updateCancellationGrant } from '../src/prisma/breezPrismaMutations.js';
import { jsDateFns } from '@breezbook/packages-core/dist/jsDateFns.js';
import { HttpError } from '../src/infra/functionalExpress.js';
import { mutations } from '../src/mutation/mutations.js';
import { v4 as uuid } from 'uuid';

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
		const outcome = doCommitCancellation(cancellation, new SystemClock());
		expect(outcome).toEqual(
			mutations([
				updateCancellationGrant({ committed: true }, { id: cancellation.id }),
				updateBooking({ status: 'cancelled' }, { id: cancellation.booking_id })
			])
		);
	});

	test('returns error if already committed', () => {
		const outcome = doCommitCancellation({ ...cancellation, committed: true }, new SystemClock());
		expect(outcome._type).toBe('http.error');
	});
	test('returns error if grant is too old', () => {
		const outcome = doCommitCancellation(
			{
				...cancellation,
				created_at: jsDateFns.addHours(new Date(), -1)
			},
			new SystemClock()
		);
		expect(outcome._type).toBe('http.error');
	});
});
