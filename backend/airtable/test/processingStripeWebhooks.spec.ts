import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import { insertOrder } from '../src/express/insertOrder.js';
import { currency, customer, environmentId, fullPaymentOnCheckout, order, price, randomInteger, tenantEnvironment, tenantId } from '@breezbook/packages-core';
import { createOrderRequest } from '@breezbook/backend-api-types';
import { PaymentIntentWebhookBody } from '../src/stripe.js';
import { STRIPE_WEBHOOK_ID } from '../src/express/stripeEndpoint.js';
import { OrderPaymentCreatedResponse } from '../src/express/handleReceivedWebhook.js';
import { prismaClient } from '../src/prisma/client.js';
import { startTestEnvironment, stopTestEnvironment } from './setup.js';

const expressPort = 3007;
const postgresPort = 54337;

const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given a migrated database', async () => {
	let testEnvironment: StartedDockerComposeEnvironment;

	beforeAll(async () => {
		testEnvironment = await startTestEnvironment(expressPort, postgresPort);
	}, 1000 * 90);

	afterAll(async () => {
		await stopTestEnvironment(testEnvironment);
	});

	test('on receipt of a successful payment for an order, a payment record for the order is created', async () => {
		const costInPence = randomInteger(5000);
		const createOrderResponse = await insertOrder(
			tenantEnv,
			createOrderRequest(order(customer('Mike', 'Hogan', 'mike@email.com'), []), price(costInPence, currency('GBP')), fullPaymentOnCheckout()),
			[]
		);
		const paymentIntentWebhook: PaymentIntentWebhookBody = {
			_type: 'stripe.payment.intent.webhook.body',
			id: 'pi_3OYX8wFTtlkGavGx0RSugobm',
			amount: costInPence,
			currency: 'gbp',
			status: 'succeeded',
			metadata: {
				_type: 'order.metadata',
				orderId: createOrderResponse.orderId,
				tenantId: tenantEnv.tenantId.value,
				environmentId: tenantEnv.environmentId.value
			}
		};
		const postResponse = await fetch(`http://localhost:${expressPort}/internal/api/dev/webhook/received`, {
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
		const orderPaymentCreatedResponse = (await postResponse.json()) as OrderPaymentCreatedResponse;
		expect(orderPaymentCreatedResponse._type).toBe('order.payment.created.response');
		expect(orderPaymentCreatedResponse.orderId).toBe(createOrderResponse.orderId);
		expect(orderPaymentCreatedResponse.paymentId).toBeDefined();
		const prisma = prismaClient();
		const payment = await prisma.order_payments.findUnique({ where: { id: orderPaymentCreatedResponse.paymentId } });
		expect(payment).toBeDefined();
		expect(payment?.order_id).toBe(createOrderResponse.orderId);
		expect(payment?.amount_in_minor_units).toBe(costInPence);
		expect(payment?.amount_currency).toBe('gbp');
		expect(payment?.provider).toBe('Stripe');
		expect(payment?.provider_transaction_id).toBe(paymentIntentWebhook.id);
		expect(payment?.status).toBe(paymentIntentWebhook.status);
	});
});
