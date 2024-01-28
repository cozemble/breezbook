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
	tenantEnvironment,
	tenantId
} from '@breezbook/packages-core';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestEnvironment, stopTestEnvironment } from './setup.js';
import { insertOrder } from '../src/express/insertOrder.js';
import { CancellationGrantResponse, createOrderRequest } from '@breezbook/backend-api-types';
import { goodCustomer } from './helper.js';
import { StartedDockerComposeEnvironment } from 'testcontainers';

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
		const cancellationGrantResponse = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/booking/${bookingId}/cancellationGrant`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		expect(cancellationGrantResponse.status).toBe(400);
	});

	test('can get a cancellation grant for a booking in the future', async () => {
		const bookingId = await createBooking(isoDateFns.addDays(isoDate(), 3));
		const cancellationGrantResponse = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/booking/${bookingId}/cancellationGrant`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		expect(cancellationGrantResponse.status).toBe(201);
		const cancellationGrant = (await cancellationGrantResponse.json()) as CancellationGrantResponse;
		expect(cancellationGrant).toBeDefined();
		expect(cancellationGrant._type).toBe('cancellation.granted');
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
