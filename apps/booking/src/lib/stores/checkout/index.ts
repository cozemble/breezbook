import { onMount } from 'svelte';
import { derived, get, type Readable, writable } from 'svelte/store';
import { H } from 'highlight.run';

import * as core from '@breezbook/packages-core';
import { addOnId, addOnOrder } from '@breezbook/packages-core';
import {
	type PricedBasket,
	pricedCreateOrderRequest,
	unpricedBasket,
	unpricedBasketLine
} from '@breezbook/backend-api-types';

import { createStoreContext } from '$lib/common/helpers/store';
import api from '$lib/common/api';

import { createPaymentStore } from './payment';
import { createCustomerStore } from './customer';
import notifications from '../notifications';
import tenantStore from '../tenant';
import { locationStore } from '../location';

const CART_STORE_CONTEXT_KEY = 'cart_store';

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
	const tenant = tenantStore.get();
	const tenantLocation = locationStore.get();

	const customerStore = createCustomerStore();
	const paymentStore = createPaymentStore();

	const items = writable<Booking[]>([]);
	const couponCode = writable<string | undefined>();

	const total: Readable<PricedBasket | null> = derived(
		[items, couponCode],
		([$items, $couponCode], set) => {
			if ($items.length === 0) return set(null);

			// remove eventually
			const tNotif = notifications.create({
				title: 'Calculating total',
				description: 'Please wait...',
				type: 'loading',
				canUserClose: false
			});

			const basketItems = $items.map((item) => {
				return unpricedBasketLine(
					core.serviceId(item.service.id),
					core.locationId(tenantLocation.id),
					item.extras.map((extra) => addOnOrder(addOnId(extra.id))),
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

			const coupon = $couponCode ? core.couponCode($couponCode) : undefined;
			const unpriced = unpricedBasket(basketItems, coupon);

			api.basket
				.pricing(tenant.slug, unpriced)
				.then((res) => set(res))
				.catch((err) => {
					console.warn(err);

					const noSuchCoupon = err.response.data.errorCode === 'addOrder.no.such.coupon';
					if (noSuchCoupon) couponCode.set(undefined);

					notifications.create({
						title: 'Error',
						description: err.response.data.errorMessage,
						type: 'error',
						duration: 4000
					});
				})
				.finally(() => {
					tNotif.remove();
				});
		}
	);

	// ----------------------------------------------------------------

	const addItem = (item: Omit<Booking, 'id'>) => {
		const newItem = {
			...item,
			id: Math.random().toString(36).substring(2, 9)
		};

		items.update((prev) => [...prev, newItem]);
		return newItem;
	};

	const removeItem = (itemId: string) =>
		items.update((prev) => prev.filter((i) => i.id !== itemId));

	const clearItems = () => {
		items.set([]);
		saveToLocalStorage([]);
	};

	const submitOrder = async () => {
		const theTotal = get(total);
		if (!theTotal) return;

		const theCustomer = get(customerStore.customer);
		const patchedCustomer = {
			...theCustomer,
			id: core.customerId(),
			email: core.email(theCustomer.email as unknown as string)
		};

		// Identify the user on Highlight so we can track who that user is
		H.identify(patchedCustomer.email.value, {
			id: patchedCustomer.id.value,
			firstName: patchedCustomer.firstName,
			lastName: patchedCustomer.lastName,
			formData: JSON.stringify(patchedCustomer.formData)
		});

		const orderReq = pricedCreateOrderRequest(
			theTotal,
			patchedCustomer,
			core.fullPaymentOnCheckout()
		);

		paymentStore.initiatePayment(orderReq);
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
		couponCode,
		// order,
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
