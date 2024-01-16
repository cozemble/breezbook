import Stripe from 'stripe';
import { mandatory, Price } from '@breezbook/packages-core';
import { errorResponse, ErrorResponse } from '@breezbook/backend-api-types';

export interface NewPaymentIntent {
	_type: 'new.payment.intent';
	id: string;
	amount: number;
	client_secret: string | null;
	currency: string;
}

interface StripeCustomerMetadata {
	customerId: string;
	firstName: string;
	lastName: string;
}

function customerMetadataToStripeMetadata(metadata: StripeCustomerMetadata): Stripe.MetadataParam {
	return {
		customerId: metadata.customerId,
		firstName: metadata.firstName,
		lastName: metadata.lastName
	};
}

export interface StripeCustomerInput {
	email: string;
	firstName: string;
	lastName: string;
	metadata: StripeCustomerMetadata;
}

export interface StripeCustomer extends StripeCustomerInput {
	_type: 'stripe.customer';
	id: string;
}

export const stripeErrorCodes = {
	missingClientSecret: 'stripe.missing.client.secret',
	failedToUpsertCustomer: 'stripe.failed.to.upsert.customer'
};

export interface PaymentIntentWebhookBody {
	_type: 'payment.intent.webhook.body';
	id: string;
	amount: number;
	currency: string;
	status: Stripe.PaymentIntent.Status;
}

export interface OrderMetadata {
	orderId: string;
	tenantId: string;
	environmentId: string;
}

export type StripeWebhookBody = PaymentIntentWebhookBody;

export interface StripeClient {
	createPaymentIntent(customer: StripeCustomerInput, amount: Price, metadata: MetadataParam): Promise<NewPaymentIntent | ErrorResponse>;

	upsertCustomer(customer: StripeCustomerInput): Promise<StripeCustomer | ErrorResponse>;

	onWebhook(webhookBody: string, signatureValue: string): StripeWebhookBody | ErrorResponse;
}

type MetadataParam = Record<string, string | number | null>;

export class RealStripeClient implements StripeClient {
	private readonly stripe: Stripe;

	constructor(secretKey: string) {
		this.stripe = new Stripe(secretKey);
	}

	public onWebhook(webhookBody: string, signatureValue: string): StripeWebhookBody | ErrorResponse {
		try {
			const event = this.stripe.webhooks.constructEvent(
				webhookBody,
				signatureValue,
				mandatory(process.env.STRIPE_WEBHOOK_SECRET, `Missing env var STRIPE_WEBHOOK_SECRET`)
			);
			switch (event.type) {
				case 'payment_intent.succeeded':
					return this.handlePaymentIntentSucceeded(event.data.object);
				default:
					return errorResponse('stripe.webhook.unknown.event.type', `Unknown event type ${event.type}`);
			}
		} catch (e: unknown) {
			console.error('Error in onWebhook:', e);
			if (e instanceof Error) {
				return errorResponse('stripe.webhook.error', e.message);
			}
			throw e;
		}
	}

	private handlePaymentIntentSucceeded(intent: Stripe.PaymentIntent): StripeWebhookBody | ErrorResponse {
		return {
			_type: 'payment.intent.webhook.body',
			id: intent.id,
			amount: intent.amount,
			currency: intent.currency,
			status: intent.status
		};
	}

	public async upsertCustomer(customerInput: StripeCustomerInput): Promise<StripeCustomer | ErrorResponse> {
		try {
			const customers = await this.stripe.customers.list({
				email: customerInput.email,
				limit: 1
			});

			let customer: Stripe.Customer;

			if (customers.data.length === 0) {
				customer = await this.stripe.customers.create({
					email: customerInput.email,
					name: `${customerInput.firstName} ${customerInput.lastName}`,
					metadata: customerMetadataToStripeMetadata(customerInput.metadata)
				});
			} else {
				customer = await this.stripe.customers.update(customers.data[0].id, {
					email: customerInput.email,
					name: `${customerInput.firstName} ${customerInput.lastName}`,
					metadata: customerMetadataToStripeMetadata(customerInput.metadata)
				});
			}

			return {
				_type: 'stripe.customer',
				id: customer.id,
				email: customerInput.email,
				firstName: customerInput.firstName,
				lastName: customerInput.lastName,
				metadata: customerInput.metadata
			};
		} catch (error: unknown) {
			console.error('Error in upserting customer:', error);
			if (error instanceof Error) {
				return errorResponse(stripeErrorCodes.failedToUpsertCustomer, error.message);
			}
			throw error;
		}
	}

	public async createPaymentIntent(customerInput: StripeCustomerInput, amount: Price, metadata: MetadataParam): Promise<NewPaymentIntent | ErrorResponse> {
		const customer = await this.upsertCustomer(customerInput);
		if (customer._type === 'error.response') {
			return customer;
		}
		const stripeResponse = await this.stripe.paymentIntents.create({
			amount: amount.amount.value,
			currency: amount.currency.value,
			metadata,
			payment_method_types: ['card'],
			customer: customer.id
		});
		if (stripeResponse.client_secret === undefined) {
			return errorResponse(stripeErrorCodes.missingClientSecret);
		}
		return {
			_type: 'new.payment.intent',
			id: stripeResponse.id,
			amount: stripeResponse.amount,
			client_secret: stripeResponse.client_secret,
			currency: stripeResponse.currency
		};
	}
}

export class StubStripeClient implements StripeClient {
	public async createPaymentIntent(customerInput: StripeCustomerInput, amount: Price, metadata: MetadataParam): Promise<NewPaymentIntent | ErrorResponse> {
		return {
			_type: 'new.payment.intent',
			id: 'stub-payment-intent-id',
			amount: amount.amount.value,
			client_secret: 'stub-client-secret',
			currency: amount.currency.value
		};
	}

	public async upsertCustomer(customerInput: StripeCustomerInput): Promise<StripeCustomer | ErrorResponse> {
		return {
			_type: 'stripe.customer',
			id: 'stub-customer-id',
			email: customerInput.email,
			firstName: customerInput.firstName,
			lastName: customerInput.lastName,
			metadata: customerInput.metadata
		};
	}

	public onWebhook(webhookBody: string): StripeWebhookBody | ErrorResponse {
		return JSON.parse(webhookBody);
	}
}
