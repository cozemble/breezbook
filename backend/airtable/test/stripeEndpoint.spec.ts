import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { carwash, environmentId, fullPaymentOnCheckout, order, orderLine, tenantEnvironment, tenantId } from '@breezbook/packages-core';
import { goodCustomer, goodServiceFormData, postOrder, threeDaysFromNow } from './helper.js';
import { OrderCreatedResponse, PaymentIntentResponse } from '@breezbook/backend-api-types';
import { storeTenantSecret } from '../src/infra/secretsInPostgres.js';
import { STRIPE_API_KEY_SECRET_NAME, STRIPE_PUBLIC_KEY_SECRET_NAME } from '../src/express/stripeEndpoint.js';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import { startTestEnvironment, stopTestEnvironment } from './setup.js';

const expressPort = 3004;
const postgresPort = 54334;

const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given an order', () => {
	let orderCreatedResponse: OrderCreatedResponse;
	let testEnvironment: StartedDockerComposeEnvironment;

	beforeAll(async () => {
		testEnvironment = await startTestEnvironment(expressPort, postgresPort, async () => {
			await storeTenantSecret(tenantEnv, STRIPE_API_KEY_SECRET_NAME, 'stripe api key', 'sk_test_something');
			await storeTenantSecret(tenantEnv, STRIPE_PUBLIC_KEY_SECRET_NAME, 'stripe public key', 'pk_test_something');
			const theOrder = order(goodCustomer, [
				orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], threeDaysFromNow, carwash.fourToSix, [goodServiceFormData])
			]);

			const response = await postOrder(theOrder, carwash.smallCarWash.price, expressPort);
			expect(response.status).toBe(200);
			orderCreatedResponse = (await response.json()) as OrderCreatedResponse;
		});
	}, 1000 * 90);

	afterAll(async () => {
		await stopTestEnvironment(testEnvironment);
	});

	test('can create a payment intent and get client_secret and public api key', async () => {
		const paymentIntentResponse = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/orders/${orderCreatedResponse.orderId}/paymentIntent`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(fullPaymentOnCheckout())
		});
		expect(paymentIntentResponse.status).toBe(200);
		const json = (await paymentIntentResponse.json()) as PaymentIntentResponse;
		expect(json.clientSecret).toBeDefined();
		expect(json.stripePublicKey).toBe('pk_test_something');
	});
});
