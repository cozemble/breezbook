import express from 'express';
import { orderIdParam, tenantEnvironmentParam, withOneRequestParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import { prismaClient } from '../prisma/client.js';
import { StripeCustomerInput, stripeErrorCodes } from '../stripe.js';
import { getTenantSecret } from '../infra/secretsInPostgres.js';
import { DbCustomer } from '../prisma/dbtypes.js';
import { currency, price } from '@breezbook/packages-core';
import { errorResponse, PaymentIntentResponse } from '@breezbook/backend-api-types';
import { getStripeClient } from './getStripeClient.js';
import { v4 as uuidv4 } from 'uuid';
import {inngest} from "../inngest/client.js";

export const STRIPE_API_KEY_SECRET_NAME = 'stripe-api-key';
export const STRIPE_PUBLIC_KEY_SECRET_NAME = 'stripe-public-key';

function toStripeCustomerInput(customers: DbCustomer): StripeCustomerInput {
	return {
		email: customers.email,
		firstName: customers.first_name,
		lastName: customers.last_name,
		metadata: {
			customerId: customers.id,
			firstName: customers.first_name,
			lastName: customers.last_name
		}
	};
}

export const STRIPE_WEBHOOK_ID = 'stripe';

export async function onStripeWebhook(req: express.Request, res: express.Response): Promise<void> {
	await withOneRequestParam(req, res, tenantEnvironmentParam(), async (tenantEnvironment) => {
		const stripeApiKey = await getTenantSecret(tenantEnvironment, STRIPE_API_KEY_SECRET_NAME);
		const stripeClient = getStripeClient(stripeApiKey, tenantEnvironment.environmentId.value);
		const event = stripeClient.onWebhook(req.rawBody, req.headers['stripe-signature'] as string);
		if (event._type === 'error.response') {
			res.status(500).send(event);
			return;
		}
		const prisma = prismaClient();
		const postedWebhookId = uuidv4();
		await prisma.received_webhooks.create({
			data: {
				id: postedWebhookId,
				payload: event as any,
				environment_id: tenantEnvironment.environmentId.value,
				webhook_id: STRIPE_WEBHOOK_ID,
				tenant_id: tenantEnvironment.tenantId.value
			}
		});
		res.status(202).send({ id: postedWebhookId });
	});
}

export async function createStripePaymentIntent(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, tenantEnvironmentParam(), orderIdParam(), async (tenantEnvironment, orderId) => {
		const prisma = prismaClient();
		const tenant_id = tenantEnvironment.tenantId.value;
		const environment_id = tenantEnvironment.environmentId.value;
		const order = await prisma.orders.findUnique({
			where: { id: orderId.value, tenant_id, environment_id },
			include: { customers: true }
		});
		if (!order) {
			res.status(404).send(`Order ${orderId.value} not found`);
			return;
		}
		const orderTotal = price(order.total_price_in_minor_units, currency(order.total_price_currency));
		const stripeApiKey = await getTenantSecret(tenantEnvironment, STRIPE_API_KEY_SECRET_NAME);
		const stripePublicKey = await getTenantSecret(tenantEnvironment, STRIPE_PUBLIC_KEY_SECRET_NAME);

		const stripeClient = getStripeClient(stripeApiKey, environment_id);
		const paymentIntent = await stripeClient.createPaymentIntent(toStripeCustomerInput(order.customers), orderTotal, {
			_type: 'order.metadata',
			tenantId: tenant_id,
			environmentId: environment_id,
			orderId: orderId.value
		});
		if (paymentIntent._type === 'error.response') {
			res.status(500).send(paymentIntent);
			return;
		}
		if (paymentIntent.client_secret === null) {
			res.status(500).send(errorResponse(stripeErrorCodes.missingClientSecret, 'Missing client secret'));
			return;
		}
		const response: PaymentIntentResponse = {
			stripePublicKey,
			clientSecret: paymentIntent.client_secret
		};
		res.status(200).send(response);
	});
}
