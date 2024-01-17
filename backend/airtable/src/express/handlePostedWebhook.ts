import express from 'express';
import { environmentIdParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import { errorResponse, ErrorResponse } from '@breezbook/backend-api-types';
import { prismaClient } from '../prisma/client.js';
import { PaymentIntentWebhookBody } from '../stripe.js';
import { v4 as uuidv4 } from 'uuid';

export interface PostedWebhook {
	webhook_id: string;
	payload: unknown;
}

export function postedWebhookBody(): (req: express.Request, res: express.Response) => PostedWebhook | null {
	return (req, res) => {
		if (req.body === undefined) {
			res.status(400).send('Missing body');
			return null;
		}
		if (req.body.webhook_id === undefined) {
			res.status(400).send('Missing webhook_id');
			return null;
		}
		if (req.body.payload === undefined) {
			res.status(400).send('Missing payload');
			return null;
		}
		return {
			webhook_id: req.body.webhook_id,
			payload: req.body.payload
		};
	};
}

export interface OrderPaymentCreatedResponse {
	_type: 'order.payment.created.response';
	orderId: string;
	paymentId: string;
}

type WebhookHandleResponse = OrderPaymentCreatedResponse;

async function handleWebhook(webhookBody: PostedWebhook): Promise<WebhookHandleResponse | ErrorResponse> {
	if (webhookBody.webhook_id !== 'stripe') {
		return errorResponse('Unknown webhook_id');
	}
	const payload = webhookBody.payload as any;
	if (payload._type !== 'stripe.payment.intent.webhook.body') {
		return errorResponse('Unknown payload type');
	}
	const payloadPaymentIntent = payload as PaymentIntentWebhookBody;
	const metadata = payload.metadata;
	if (metadata._type !== 'order.metadata') {
		return errorResponse('Unknown metadata type');
	}
	if (!metadata.orderId) {
		return errorResponse('Missing orderId in metadata');
	}
	const orderId = metadata.orderId;
	const prisma = prismaClient();
	const paymentId = uuidv4();
	await prisma.order_payments.create({
		data: {
			id: paymentId,
			tenants: { connect: { tenant_id: metadata.tenantId } },
			environment_id: metadata.environmentId,
			orders: { connect: { id: orderId } },
			status: payloadPaymentIntent.status,
			provider: 'Stripe',
			provider_transaction_id: payloadPaymentIntent.id,
			amount_in_minor_units: payloadPaymentIntent.amount,
			amount_currency: payloadPaymentIntent.currency
		}
	});
	return {
		_type: 'order.payment.created.response',
		orderId,
		paymentId
	};
}

export async function handlePostedWebhook(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, environmentIdParam(), postedWebhookBody(), async (environmentId, webhookBody) => {
		const response = await handleWebhook(webhookBody);
		if (response._type === 'error.response') {
			res.status(500).send(response);
			return;
		}
		res.status(200).send(response);
	});
}
