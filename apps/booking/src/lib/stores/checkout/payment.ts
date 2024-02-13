import api from '$lib/common/api';
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
import { onMount } from 'svelte';
import { get, writable } from 'svelte/store';

export const createPaymentStore = () => {
	const clientSecret = writable<string | null>(null);
	const stripePublicKey = writable<string | null>(null);
	const stripe = writable<Stripe | null>(null);
	const elements = writable<StripeElements | undefined>(undefined);

	// ----------------------------------------------------------

	// doing this onMount so that we can use the store in the browser
	onMount(() => {
		stripePublicKey.subscribe(async (key) => {
			if (!key) return;

			const stripeInstance = await loadStripe(key);
			stripe.set(stripeInstance);
		});
	});

	// ----------------------------------------------------------

	const createPaymentIntent = async (orderId: string) => {
		const res = await api.payment.createPaymentIntent(orderId);

		if (!res?.clientSecret || !res?.stripePublicKey) return;

		clientSecret.set(res.clientSecret);
		stripePublicKey.set(res.stripePublicKey);
	};

	const onSubmit = async () => {
		const stripeInstance = await get(stripe);
		const elem = get(elements);

		if (!stripeInstance || !elem) return;

		const { error } = await stripeInstance.confirmPayment({
			elements: elem,
			confirmParams: {
				// Make sure to change this to your payment completion page
				return_url: window.location.origin + '/payment/success'
			}
		});

		// This point will only be reached if there is an immediate error when
		// confirming the payment. Otherwise, your customer will be redirected to
		// your `return_url`. For some payment methods like iDEAL, your customer will
		// be redirected to an intermediate site first to authorize the payment, then
		// redirected to the `return_url`.
		if (error.type === 'card_error' || error.type === 'validation_error') {
			console.error(error.message);
		} else {
			console.error('An unexpected error occurred.');
		}
	};

	return {
		clientSecret,
		stripePublicKey,

		stripe,
		elements,

		createPaymentIntent,
		onSubmit
	};
};
