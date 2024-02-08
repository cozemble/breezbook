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
import { AvailabilityResponse, CancellationGranted, createOrderRequest, OrderCreatedResponse } from '@breezbook/backend-api-types';
import { insertOrder } from '../src/express/insertOrder.js';
import { expressApp } from '../src/express/expressApp.js';
import { prismaClient } from '../src/prisma/client.js';

/**
 * This test should contain one test case for each API endpoint, or integration scenario,
 * to make sure that the app is configured correctly.  Details of the logic of each endpoint
 * should be unit tested.
 */
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

	test('should be able to get service availability', async () => {
		const fetched = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/service/smallCarWash/availability?fromDate=2023-12-20&toDate=2023-12-23`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const json = (await fetched.json()) as AvailabilityResponse;

		expect(json.slots['2023-12-19']).toBeUndefined();
		expect(json.slots['2023-12-20']).toHaveLength(3);
		expect(json.slots['2023-12-21']).toHaveLength(3);
		expect(json.slots['2023-12-22']).toHaveLength(3);
		expect(json.slots['2023-12-23']).toHaveLength(3);
		expect(json.slots['2023-12-24']).toBeUndefined();
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

	test('calls to /internal/api requires an API key in the Authorization header', async () => {
		const response = await fetch(`http://localhost:${expressPort}/internal/api/anything`);
		expect(response.status).toBe(401);
	});

	test('inserting a new booking queues up an outbound webhook', async () => {
		const createOrderResponse = await insertOrder(
			tenantEnv,
			createOrderRequest(
				order(goodCustomer, [orderLine(carwash.mediumCarWash.id, carwash.mediumCarWash.price, [], isoDate(), carwash.nineToOne, [])]),
				carwash.mediumCarWash.price,
				fullPaymentOnCheckout()
			),
			carwash.services
		);
		expect(createOrderResponse.bookingIds).toHaveLength(1);
		expect(createOrderResponse.bookingIds[0]).toBeDefined();
		const prisma = prismaClient();
		const found = await prisma.$queryRaw`SELECT *
                                         FROM system_outbound_webhooks
                                         WHERE payload ->> 'id' = ${createOrderResponse.bookingIds[0]}`;
		expect(found).toHaveLength(1);
		const outboundWebhook = found[0];
		expect(outboundWebhook.action).toBe('create');
		expect(outboundWebhook.payload_type).toBe('booking');
		expect(outboundWebhook.status).toBe('pending');
		expect(outboundWebhook.payload.id).toEqual(createOrderResponse.bookingIds[0]);
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
