import {
	addOnOrder,
	carwash,
	environmentId,
	fullPaymentOnCheckout,
	IsoDate,
	isoDate,
	isoDateFns,
	mandatory,
	order,
	orderLine,
	priceFns,
	tenantEnvironment,
	tenantId
} from '@breezbook/packages-core';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { startTestEnvironment, stopTestEnvironment } from './setup.js';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import { fourDaysFromNow, goodCustomer, goodServiceFormData, postOrder } from './helper.js';
import { CancellationGranted, createOrderRequest, OrderCreatedResponse } from '@breezbook/backend-api-types';
import { insertOrder } from '../src/express/insertOrder.js';

const expressPort = 3010;
const postgresPort = 54340;
const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given a migrated database', async () => {
	let testEnvironment: StartedDockerComposeEnvironment;

	beforeAll(async () => {
		testEnvironment = await startTestEnvironment(expressPort, postgresPort);
	}, 1000 * 90);

	afterAll(async () => {
		await stopTestEnvironment(testEnvironment);
	});

	test('can add an order for two car washes, each with different add-ons', async () => {
		const twoServices = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], fourDaysFromNow, carwash.nineToOne, [goodServiceFormData]),
			orderLine(
				carwash.mediumCarWash.id,
				carwash.mediumCarWash.price,
				[addOnOrder(carwash.wax.id), addOnOrder(carwash.polish.id)],
				fourDaysFromNow,
				carwash.nineToOne,
				[goodServiceFormData]
			)
		]);

		const fetched = await postOrder(
			twoServices,
			priceFns.add(carwash.smallCarWash.price, carwash.wax.price, carwash.mediumCarWash.price, carwash.wax.price, carwash.polish.price),
			expressPort
		);
		if (!fetched.ok) {
			console.error(await fetched.text());
			throw new Error(`Failed to add order`);
		}
		const json = (await fetched.json()) as OrderCreatedResponse;
		expect(json.orderId).toBeDefined();
		expect(json.customerId).toBeDefined();
		expect(json.bookingIds.length).toBe(2);
		expect(json.orderLineIds.length).toBe(2);
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
