import {
	carwash,
	environmentId,
	fullPaymentOnCheckout,
	IsoDate,
	isoDate,
	isoDateFns,
	mandatory,
	order,
	orderLine,
	SystemClock,
	tenantEnvironment,
	tenantId
} from '@breezbook/packages-core';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestEnvironment, stopTestEnvironment } from './setup.js';
import { insertOrder } from '../src/express/insertOrder.js';
import { CancellationGranted, createOrderRequest } from '@breezbook/backend-api-types';
import { goodCustomer } from './helper.js';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import { doCommitCancellation } from '../src/express/cancellation.js';
import { prismaClient } from '../src/prisma/client.js';
import { DbCancellationGrant } from '../src/prisma/dbtypes.js';
import { prismaUpdates } from '../src/infra/prismaMutations.js';
import { updateBooking, updateCancellationGrant } from '../src/prisma/breezPrismaMutations.js';
import { jsDateFns } from '@breezbook/packages-core/dist/jsDateFns.js';

const expressPort = 3009;
const postgresPort = 54339;
const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given a migrated database', async () => {
	let testEnvironment: StartedDockerComposeEnvironment;

	beforeAll(async () => {
		testEnvironment = await startTestEnvironment(expressPort, postgresPort);
	}, 1000 * 90);

	afterAll(async () => {
		await stopTestEnvironment(testEnvironment);
	});

	test("can't get a cancellation grant for a booking in the past", async () => {
		const bookingId = await createBooking(isoDateFns.addDays(isoDate(), -1));
		const cancellationGrantResponse = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/booking/${bookingId}/cancellation/grant`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		expect(cancellationGrantResponse.status).toBe(400);
	});

	test('can get a cancellation grant for a booking in the future', async () => {
		const { bookingId, cancellationGrant } = await completeCancellationGrant();
		expect(cancellationGrant).toBeDefined();
		expect(cancellationGrant._type).toBe('cancellation.granted');
		expect(cancellationGrant.bookingId).toBe(bookingId);
		expect(cancellationGrant.cancellationId).toBeDefined();
		expect(cancellationGrant.refundPercentageAsRatio).toBe(1);
	});
});

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
			prismaUpdates([
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

async function completeCancellationGrant() {
	const bookingId = await createBooking(isoDateFns.addDays(isoDate(), 3));
	const cancellationGrantResponse = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/booking/${bookingId}/cancellation/grant`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		}
	});
	expect(cancellationGrantResponse.status).toBe(201);
	const cancellationGrant = (await cancellationGrantResponse.json()) as CancellationGranted;
	return { bookingId, cancellationGrant };
}

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
