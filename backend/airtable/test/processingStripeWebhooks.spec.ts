import { afterAll, beforeAll, describe, test } from 'vitest';
import { appWithTestContainer } from '../src/infra/appWithTestContainer.js';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import { insertOrder } from '../src/express/insertOrder.js';
import { currency, customer, environmentId, fullPaymentOnCheckout, order, price, tenantEnvironment, tenantId } from '@breezbook/packages-core';
import { createOrderRequest } from '@breezbook/backend-api-types';
import { PaymentIntentWebhookBody } from '../src/stripe.js';
import { STRIPE_WEBHOOK_ID } from '../src/express/stripeEndpoint.js';

const expressPort = 3007;
const postgresPort = 54337;

const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given a migrated database', async () => {
	let dockerComposeEnv: StartedDockerComposeEnvironment;
	beforeAll(async () => {
		try {
			dockerComposeEnv = await appWithTestContainer(expressPort, postgresPort);
		} catch (e) {
			console.error(e);
			throw e;
		}
	}, 1000 * 90);

	afterAll(async () => {
		await dockerComposeEnv.down();
	});

	test('on receipt of a successful payment for an order, a payment record for the order is created', async () => {
		const createOrderResponse = await insertOrder(
			tenantEnv,
			createOrderRequest(order(customer('Mike', 'Hogan', 'mike@email.com'), []), price(1000, currency('GBP')), fullPaymentOnCheckout()),
			[]
		);
		const paymentIntentWebhook: PaymentIntentWebhookBody = {
			_type: 'stripe.payment.intent.webhook.body',
			id: 'pi_3OYX8wFTtlkGavGx0RSugobm',
			amount: 1000,
			currency: 'gbp',
			status: 'succeeded',
			metadata: {
				_type: 'order.metadata',
				orderId: createOrderResponse.orderId,
				tenantId: tenantEnv.tenantId.value,
				environmentId: tenantEnv.environmentId.value
			}
		};
		const postResponse = await fetch(`http://localhost:${expressPort}/internal/api/dev/postedWebhook`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: process.env.INTERNAL_API_KEY ?? ''
			},
			body: JSON.stringify({ webhook_id: STRIPE_WEBHOOK_ID, payload: paymentIntentWebhook })
		});
		if (!postResponse.ok) {
			throw new Error(`Failed to post webhook: ${await postResponse.text()}`);
		}
	});
});
