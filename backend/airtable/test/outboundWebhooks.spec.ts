import { startTestEnvironment, stopTestEnvironment } from './setup.js';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { prismaClient } from '../src/prisma/client.js';
import { insertOrder } from '../src/express/insertOrder.js';
import { carwash, environmentId, fullPaymentOnCheckout, isoDate, order, orderLine, tenantEnvironment, tenantId } from '@breezbook/packages-core';
import { createOrderRequest } from '@breezbook/backend-api-types';
import { goodCustomer } from './helper.js';

const expressPort = 3008;
const postgresPort = 54338;
const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given a migrated database', async () => {
	let testEnvironment: StartedDockerComposeEnvironment;

	beforeAll(async () => {
		testEnvironment = await startTestEnvironment(expressPort, postgresPort);
	}, 1000 * 90);

	afterAll(async () => {
		await stopTestEnvironment(testEnvironment);
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
		const outboundWebhook = await prisma.system_outbound_webhooks.findFirst();
		expect(outboundWebhook).toBeDefined();
		expect(outboundWebhook.action).toBe('create');
		expect(outboundWebhook.payload_type).toBe('booking');
		expect(outboundWebhook.status).toBe('pending');
		expect(outboundWebhook.payload.id).toEqual(createOrderResponse.bookingIds[0]);
	});
});
