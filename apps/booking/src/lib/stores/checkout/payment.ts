import { derived, get, writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js';

import type { PricedCreateOrderRequest } from '@breezbook/backend-api-types';

import api from '$lib/common/api';
import notifications from '../notifications';
import tenantStore from '../tenant';
import orderHistoryStore from '../orderHistory';
import { settingsStore } from '../settings';
import routeStore from '../routes';

export const createPaymentStore = () => {
	const tenant = tenantStore.get();
	const settings = settingsStore.get();
	const routes = routeStore.get();

	const clientSecret = writable<string | null>(null);
	const stripePublicKey = writable<string | null>(null);
	/** keep track of payment initiation
	 * - while `false`, payment page will redirect to success page
	 */
	const paymentInitiated = derived(clientSecret, ($clientSecret) => $clientSecret !== null);
	/** bind to elements in the Elements component */
	const elements = writable<StripeElements | undefined>(undefined);
	const loading = writable<boolean>(false);

	/** derived from stripePublicKey */
	const stripe = derived<typeof stripePublicKey, Stripe | null>(stripePublicKey, ($key, set) => {
		if (!$key) return;

		const notif = notifications.create({
			title: 'Loading payment gateway',
			description: 'Please wait...',
			type: 'loading'
		});
		loading.set(true);

		loadStripe($key)
			.then(set)
			.finally(() => {
				notif.remove();
				loading.set(false);
			});
	});

	// ----------------------------------------------------------

	const createPaymentIntent = async (orderId: string) => {
		try {
			const res = await api.payment.createPaymentIntent(tenant.slug, orderId);

			clientSecret.set(res.clientSecret);
			stripePublicKey.set(res.stripePublicKey);
		} catch {
			notifications.create({
				title: 'Error',
				description: 'Failed to create payment intent',
				type: 'error',
				duration: 4000
			});

			return;
		}
	};

	/** initiate payment process
	 * 1. place order
	 * 2. create payment intent
	 * 3. redirect to payment page
	 */
	const initiatePayment = async (orderReq: PricedCreateOrderRequest) => {
		const notif = notifications.create({
			title: 'Placing order',
			description: "You'll be redirected to the payment page in a moment",
			type: 'loading',
			canUserClose: false
		});

		try {
			const orderRes = await api.booking.placeOrder(tenant.slug, orderReq);

			await createPaymentIntent(orderRes.orderId);
			notif.remove();
			goto(routes.checkout.payment());
		} catch (err) {
			console.warn('Failed to place order', err);

			notif.remove();
			notifications.create({
				title: 'Error',
				description: 'Failed to place order',
				type: 'error',
				duration: 4000
			});
			return;
		}
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
				return_url: get(settings.checkout.successReturnUrl)
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
		paymentInitiated,

		stripe,
		elements,
		loading,

		initiatePayment,
		onSubmit
	};
};
