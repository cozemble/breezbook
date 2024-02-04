import { onMount } from 'svelte';
import { derived, get, writable } from 'svelte/store';
import { createStoreContext } from '$lib/helpers/store';
import * as core from '@breezbook/packages-core';
import api from '$lib/common/api';
import { createOrderRequest } from '@breezbook/backend-api-types';

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
	const items = writable<Booking[]>([]);
	const customerStore = writable<core.Customer>(
		core.customer('Mike', 'Hogan', 'mike@email.com', {
			phone: '1234567890',
			firstLineOfAddress: '123 Fake Street',
			postcode: 'AB1 2CD'
		})
	);
	const coupons = writable<core.Coupon[]>([]);

	// TODO clean up this mess and make it make sense

	const order = derived([items, customerStore], ([$items, $customerStore]): core.Order | null => {
		if ($items.length === 0) return null;

		const lines = $items.map((item) => {
			const price = item.time.price + item.extras.reduce((acc, e) => acc + e.price, 0);
			console.log(price);

			return core.orderLine(
				core.carwash.smallCarWash.id,
				core.price(price, core.currency('GBP')),
				item.extras.map((e) => core.addOnOrder(core.addOnId(e.id))),
				core.isoDate(item.time.day),
				core.timeslotSpec(
					core.time24(item.time.start),
					core.time24(item.time.end),
					'',
					core.id(item.time.id)
				),
				[item.details]
			);
		});

		const res = core.order($customerStore, lines);
		return res;
	});

	const total = derived([order, coupons], ([$orderStore, $coupons]) => {
		if (!$orderStore) return null;

		console.log($orderStore);

		const total = core.calculateOrderTotal($orderStore, core.carwash.addOns, $coupons);

		return total;
	});

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

		const orderReq = createOrderRequest(
			theOrder,
			theTotal.orderTotal,
			core.fullPaymentOnCheckout()
		);

		const res = api.booking.placeOrder(orderReq);

		console.log(res);
	};

	// TODO properly create bookings
	// TODO properly create order
	// TODO calculate order total
	// TODO submit order to backend
	// TODO handle stripe payment stuff

	// doing this on mount otherwise SSR will fail
	onMount(() => {
		items.set(getFromLocalStorage());
		items.subscribe((value) => saveToLocalStorage(value));
	});

	return {
		items,
		addItem,
		removeItem,
		clearItems,
		coupons,
		order,
		total,
		submitOrder
	};
}

//

const checkoutStore = createStoreContext(CART_STORE_CONTEXT_KEY, createCheckoutStore);

export default checkoutStore;
