import Stripe from 'stripe';
import { Price } from '@breezbook/packages-core';
import { errorResponse, ErrorResponse } from '@breezbook/backend-api-types';

export interface PaymentIntent {
	_type: 'payment.intent';
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

export interface StripeClient {
	createPaymentIntent(customer: StripeCustomerInput, amount: Price, metadata: MetadataParam): Promise<PaymentIntent | ErrorResponse>;

	upsertCustomer(customer: StripeCustomerInput): Promise<StripeCustomer | ErrorResponse>;
}

type MetadataParam = Record<string, string | number | null>;

export class RealStripeClient implements StripeClient {
	private readonly stripe: Stripe;

	constructor(secretKey: string) {
		this.stripe = new Stripe(secretKey);
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
		} catch (error: any) {
			console.error('Error in upserting customer:', error);
			return errorResponse(stripeErrorCodes.failedToUpsertCustomer, error.message);
		}
	}

	public async createPaymentIntent(customerInput: StripeCustomerInput, amount: Price, metadata: MetadataParam): Promise<PaymentIntent | ErrorResponse> {
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
			_type: 'payment.intent',
			id: stripeResponse.id,
			amount: stripeResponse.amount,
			client_secret: stripeResponse.client_secret,
			currency: stripeResponse.currency
		};
	}
}

export class StubStripeClient implements StripeClient {
	public async createPaymentIntent(customerInput: StripeCustomerInput, amount: Price, metadata: MetadataParam): Promise<PaymentIntent | ErrorResponse> {
		return {
			_type: 'payment.intent',
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
}
