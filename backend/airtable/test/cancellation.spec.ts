import { IsoDate, isoDateFns, timezones } from '@breezbook/packages-date-time';
import { beforeEach, describe, expect, test } from 'vitest';
import { CancellationGranted } from '@breezbook/backend-api-types';
import { doCancellationRequest, doCommitCancellation } from '../src/express/cancellation.js';
import { DbCancellationGrant, DbService } from '../src/prisma/dbtypes.js';
import { updateBooking, updateCancellationGrant } from '../src/prisma/breezPrismaMutations.js';
import { jsDateFns } from '@breezbook/packages-core/dist/jsDateFns.js';
import { HttpError } from '../src/infra/functionalExpress.js';
import { mutations } from '../src/mutation/mutations.js';
import { DbBookingAndResourceRequirements } from '../src/express/getEverythingForAvailability.js';
import { SystemClock } from '@breezbook/packages-core';
import { PrismaClient } from '@prisma/client';
import { PrismockClient } from 'prismock';
import { dbCarwashTenant, loadTestCarWashTenant } from '../src/dx/loadTestCarWashTenant.js';
import { byLocation } from '../src/availability/byLocation.js';
import { tenantEnvironmentLocation } from '@breezbook/packages-types';

const london = tenantEnvironmentLocation(dbCarwashTenant.environmentId, dbCarwashTenant.tenantId, dbCarwashTenant.locations.london);

describe('given a configured tenant', () => {
	let prisma: PrismaClient;

	beforeEach(async () => {
		prisma = new PrismockClient();
		await loadTestCarWashTenant(prisma);
	});

	test('can\'t get a cancellation grant for a booking in the past', async () => {
		const dayInPast = isoDateFns.addDays(isoDateFns.today(timezones.utc), -1);
		const theBooking = makeDbBooking(dayInPast);
		const everything = await byLocation.getEverythingForAvailability(prisma, london, dayInPast, dayInPast);
		const outcome = doCancellationRequest(everything,[], theBooking, new SystemClock()) as HttpError;
		expect(outcome._type).toBe('http.error');
		expect(outcome.status).toBe(400);
	});

	test('full refund if there are no refund rules, and booking is in the future', async () => {
		const dayInFuture = isoDateFns.addDays(isoDateFns.today(timezones.utc), 1);
		const theBooking = makeDbBooking(dayInFuture);
		const everything = await byLocation.getEverythingForAvailability(prisma, london, dayInFuture, dayInFuture);
		const outcome = doCancellationRequest(everything,[], theBooking, new SystemClock()) as CancellationGranted;
		expect(outcome._type).toBe('cancellation.granted');
		expect(outcome.refundPercentageAsRatio).toBe(1.0);
	});

});

function makeDbBooking(date: IsoDate): DbBookingAndResourceRequirements {
	return {
		id: 'booking-id',
		environment_id: 'dev',
		tenant_id: dbCarwashTenant.tenantId.value,
		location_id: london.locationId.value,
		booked_capacity: 1,
		order_line_id: 'order-line-id',
		created_at: new Date(),
		updated_at: new Date(),
		date: date.value,
		status: 'confirmed',
		service_id: dbCarwashTenant.smallCarWash.id.value,
		start_time_24hr: '09:00',
		end_time_24hr: '10:00',
		customer_id: 'customer-id',
		order_id: 'order-id',
		booking_resource_requirements: []
	};
}

describe('Given a cancellation grant', () => {
	const cancellationGrant: DbCancellationGrant = {
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
		const outcome = doCommitCancellation(cancellationGrant, new SystemClock());
		expect(outcome).toEqual(
			mutations([
				updateCancellationGrant({ committed: true }, { id: cancellationGrant.id }),
				updateBooking({ status: 'cancelled' }, { id: cancellationGrant.booking_id })
			])
		);
	});

	test('returns error if already committed', () => {
		const outcome = doCommitCancellation({ ...cancellationGrant, committed: true }, new SystemClock());
		expect(outcome._type).toBe('http.error');
	});
	test('returns error if grant is too old', () => {
		const outcome = doCommitCancellation(
			{
				...cancellationGrant,
				created_at: jsDateFns.addHours(new Date(), -1)
			},
			new SystemClock()
		);
		expect(outcome._type).toBe('http.error');
	});
});
