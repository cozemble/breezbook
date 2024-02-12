import api from '$lib/common/api';
import { writable } from 'svelte/store';

export const createPaymentStore = () => {
	const clientSecret = writable<string | null>(null);

	const createPaymentIntent = async (orderId: string) => {
		const res = await api.payment.createPaymentIntent(orderId);

		if (!res?.clientSecret) return;

		clientSecret.set(res.clientSecret);
	};

	return {
		clientSecret,
		createPaymentIntent
	};
};
