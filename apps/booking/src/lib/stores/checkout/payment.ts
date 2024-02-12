import api from '$lib/common/api';
import { writable } from 'svelte/store';

export const createPaymentStore = () => {
	const clientSecret = writable<string | null>(null);
	const stripePublicKey = writable<string | null>(null);

	const createPaymentIntent = async (orderId: string) => {
		const res = await api.payment.createPaymentIntent(orderId);

		if (!res?.clientSecret || !res?.stripePublicKey) return;

		clientSecret.set(res.clientSecret);
		stripePublicKey.set(res.stripePublicKey);
	};

	return {
		clientSecret,
		stripePublicKey,
		createPaymentIntent
	};
};
