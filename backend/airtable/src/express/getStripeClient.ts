import { RealStripeClient, StripeClient, StubStripeClient } from '../stripe.js';

export function getStripeClient(stripeApiKey: string, environmentId: string): StripeClient {
	if (environmentId === 'dev' || environmentId === 'synthetic') {
		return new StubStripeClient();
	}
	return new RealStripeClient(stripeApiKey);
}
