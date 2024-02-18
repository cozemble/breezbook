import { onMount } from 'svelte';
import { derived, get, writable } from 'svelte/store';
import { createStoreContext } from '$lib/helpers/store';
import * as core from '@breezbook/packages-core';
import api from '$lib/common/api';
import { createOrderRequest } from '@breezbook/backend-api-types';
import { createPaymentStore } from './payment';
import { goto } from '$app/navigation';
import { createCustomerStore } from './customer';
import notifications from '../notifications';

const CART_STORE_CONTEXT_KEY = 'cart_store';

// TODO refactor this

const getFromLocalStorage = () => {
	const items = localStorage.getItem(CART_STORE_CONTEXT_KEY);
	if (!items) return [];

	return JSON.parse(items) as Booking[];
};

const saveToLocalStorage = (items: Booking[]) => {
	localStorage.setItem(CART_STORE_CONTEXT_KEY, JSON.stringify(items));
};

//

function createCheckoutStore() {
	const customerStore = createCustomerStore();
	const paymentStore = createPaymentStore();

	const items = writable<Booking[]>([]);
	const coupons = writable<core.Coupon[]>([]);

	const order = derived(
		[items, customerStore.customer],
		([$items, $customer]): core.Order | null => {
			if ($items.length === 0) return null;

			const lines = $items.map((item) =>
				core.orderLine(
					core.carwash.smallCarWash.id,
					core.price(item.time.price, core.currency('GBP')), // TODO correct this
					item.extras.map((e) => core.addOnOrder(core.addOnId(e.id))),
					core.isoDate(item.time.day),
					core.timeslotSpec(
						core.time24(item.time.start),
						core.time24(item.time.end),
						'',
						core.id(item.time.id)
					),
					[item.details]
				)
			);

			// TODO get rid of this, this is a hack to prevent id being lost

			return core.order(
				{
					...$customer,
					id: core.customerId(''),
					email: core.email($customer.email as unknown as string)
				},
				lines
			);
		}
	);

	const total = derived([order, coupons], ([$order, $coupons]) => {
		if (!$order) return null;
		return core.calculateOrderTotal($order, core.carwash.addOns, $coupons);
	});

	// ----------------------------------------------------------------

	const addItem = (item: Omit<Booking, 'id'>) => {
		const newItem = {
			...item,
			id: Math.random().toString(36).substring(2, 9)
		};
		console.log(newItem);
		items.update((prev) => [...prev, newItem]);
		return newItem;
	};

	const removeItem = (itemId: string) =>
		items.update((prev) => prev.filter((i) => i.id !== itemId));

	const clearItems = () => {
		items.set([]);
	};

	const submitOrder = async () => {
		const theOrder = get(order);
		if (!theOrder) return;

		const theTotal = get(total);
		if (!theTotal) return;

		const notif = notifications.create({
			title: 'Placing order',
			description: "You'll be redirected to the payment page in a moment.",
			type: 'loading',
			canUserClose: false
		});

		const orderReq = createOrderRequest(
			theOrder,
			theTotal.orderTotal,
			core.fullPaymentOnCheckout()
		);

		const orderRes = await api.booking.placeOrder(orderReq);
		console.log(orderRes);
		if (!orderRes?.orderId) {
			notif.remove();
			notifications.create({
				title: 'Error',
				description: 'Failed to place order',
				type: 'error',
				duration: 4000
			});
			return;
		}

		paymentStore.createPaymentIntent(orderRes.orderId);

		notif.remove();
		goto('/payment');
	};

	// ----------------------------------------------------------------

	// doing this on mount otherwise SSR will fail
	onMount(() => {
		items.set(getFromLocalStorage());
		items.subscribe((value) => saveToLocalStorage(value));
	});

	return {
		customerStore,
		paymentStore,

		items,
		coupons,
		order,
		total,

		addItem,
		removeItem,
		clearItems,
		submitOrder
	};
}

//

const checkoutStore = createStoreContext(CART_STORE_CONTEXT_KEY, createCheckoutStore);

export default checkoutStore;
