import api from '$lib/common/api';
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';
import { onMount } from 'svelte';
import { get, writable } from 'svelte/store';
import notifications from '../notifications';

export const createPaymentStore = () => {
	const clientSecret = writable<string | null>(null);
	const stripePublicKey = writable<string | null>(null);
	const stripe = writable<Stripe | null>(null);
	const elements = writable<StripeElements | undefined>(undefined);
	const loading = writable<boolean>(false);

	// ----------------------------------------------------------

	// doing this onMount so that we can use the store in the browser
	onMount(() => {
		stripePublicKey.subscribe(async (key) => {
			if (!key) return;

			loading.set(true);

			const notif = notifications.create({
				title: 'Loading payment gateway',
				description: 'Please wait...',
				type: 'loading'
			});

			// false timeout // TODO remove
			await new Promise((res) => setTimeout(res, 1000));

			const stripeInstance = await loadStripe(key);
			stripe.set(stripeInstance);
			notif.remove();
			loading.set(false);
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
		const notif = notifications.create({
			title: 'Processing payment',
			description: 'Hold on a moment...',
			type: 'loading'
		});

		const stripeInstance = get(stripe);
		const elem = get(elements);

		if (!stripeInstance || !elem) return;

		const { error } = await stripeInstance.confirmPayment({
			elements: elem,
			confirmParams: {
				// Make sure to change this to your payment completion page
				return_url: window.location.origin + '/payment/success'
			}
		});

		notif.remove();

		// This point will only be reached if there is an immediate error when
		// confirming the payment. Otherwise, your customer will be redirected to
		// your `return_url`. For some payment methods like iDEAL, your customer will
		// be redirected to an intermediate site first to authorize the payment, then
		// redirected to the `return_url`.
		if (error.type === 'card_error' || error.type === 'validation_error') {
			notifications.create({
				title: 'Payment failed',
				description: error.message,
				type: 'error',
				duration: 5000
			});
		} else {
			notifications.create({
				title: 'Payment failed',
				description:
					'An unexpected error occurred while processing your payment. Please try again later.',
				type: 'error',
				duration: 5000
			});
		}
	};

	return {
		clientSecret,
		stripePublicKey,

		stripe,
		elements,
		loading,

		createPaymentIntent,
		onSubmit
	};
};
