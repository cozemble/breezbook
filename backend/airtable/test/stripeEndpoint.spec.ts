import { beforeAll, describe, expect, test } from 'vitest';
import { carwash, environmentId, fullPaymentOnCheckout, order, orderLine, tenantEnvironment, tenantId } from '@breezbook/packages-core';
import { goodCustomer, goodServiceFormData, postOrder, threeDaysFromNow } from './helper.js';
import { ErrorResponse, OrderCreatedResponse, PaymentIntentResponse } from '@breezbook/backend-api-types';
import { storeSecret } from '../src/infra/secretsInPostgres.js';
import { STRIPE_API_KEY_SECRET_NAME, STRIPE_PUBLIC_KEY_SECRET_NAME } from '../src/express/stripeEndpoint.js';
import { appWithTestContainer, setTestSecretsEncryptionKey } from '../src/infra/appWithTestContainer.js';

const expressPort = 3004;
const postgresPort = 54334;

const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given an order', () => {
	let orderCreatedResponse: OrderCreatedResponse;

	beforeAll(async () => {
		try {
			await appWithTestContainer(expressPort, postgresPort);
		} catch (e) {
			console.error(e);
			throw e;
		}

		setTestSecretsEncryptionKey();
		await storeSecret(tenantEnv, STRIPE_API_KEY_SECRET_NAME, 'stripe api key', 'sk_test_something');
		await storeSecret(tenantEnv, STRIPE_PUBLIC_KEY_SECRET_NAME, 'stripe public key', 'pk_test_something');
		const theOrder = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], threeDaysFromNow, carwash.fourToSix, [goodServiceFormData])
		]);

		const response = await postOrder(theOrder, carwash.smallCarWash.price, expressPort);
		if (response.status !== 200) {
			const json = (await response.json()) as ErrorResponse;
			console.error({ json });
			throw new Error(`Failed to create order: ${response.status}`);
		}
		expect(response.status).toBe(200);
		orderCreatedResponse = (await response.json()) as OrderCreatedResponse;
	}, 1000 * 90);

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
