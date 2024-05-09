import { onMount } from 'svelte';
import { derived, get, type Readable, writable } from 'svelte/store';

import * as core from '@breezbook/packages-core';
import { addOnId, addOnOrder } from '@breezbook/packages-core';
import {
	type PricedBasket,
	pricedCreateOrderRequest,
	unpricedBasket,
	unpricedBasketLine
} from '@breezbook/backend-api-types';

import { goto } from '$app/navigation';

import { createStoreContext } from '$lib/common/helpers/store';
import api from '$lib/common/api';

import { createPaymentStore } from './payment';
import { createCustomerStore } from './customer';
import notifications from '../notifications';
import tenantStore from '../tenant';
import { locationStore } from '../location';
import routeStore from '../routes';

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
	const tenant = tenantStore.get();
	const tenantLocation = locationStore.get();
	const routes = routeStore.get();

	const customerStore = createCustomerStore();
	const paymentStore = createPaymentStore();

	const items = writable<Booking[]>([]);
	const couponCode = writable<string | undefined>();

	// const order = derived(
	//     [items, customerStore.customer],
	//     ([$items, $customer]): core.Order | null => {
	//         if ($items.length === 0) return null;
	//
	//         const lines = $items.map((item) =>
	//             core.orderLine(
	//                 core.serviceId(item.service.id),
	//                 core.locationId(tenantLocation.id), // TODO correct the hard-coded location
	//                 core.price(item.time.price, core.currency('GBP')), // TODO correct this
	//                 item.extras.map((e) => core.addOnOrder(core.addOnId(e.id))),
	//                 core.isoDate(item.time.day),
	//                 core.timeslotSpec(
	//                     core.time24(item.time.start),
	//                     core.time24(item.time.end),
	//                     '',
	//                     core.id(item.time.id)
	//                 ),
	//                 [item.details]
	//             )
	//         );
	//
	//         // TODO get rid of this, this is a hack to prevent id being lost
	//
	//         return core.order(
	//             {
	//                 ...$customer,
	//                 id: core.customerId(),
	//                 email: core.email($customer.email as unknown as string)
	//             },
	//             lines
	//         );
	//     }
	// );

	const total: Readable<PricedBasket | null> = derived(
		[items, couponCode],
		([$items, $couponCode], set) => {
			if ($items.length === 0) return set(null);

			const basketItems = $items.map((item) => {
				return unpricedBasketLine(
					core.serviceId(item.service.id),
					core.locationId(tenantLocation.id), // TODO correct the hard-coded location
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

			const _couponCode = $couponCode ? core.couponCode($couponCode) : undefined;

			const unpriced = unpricedBasket(basketItems, _couponCode);

			const tNotif = notifications.create({
				title: 'Calculating total',
				description: 'Please wait...',
				type: 'loading',
				canUserClose: false
			});

			api.basket
				.pricing(tenant.slug, unpriced)
				.then((res) => {
					set(res);
					tNotif.remove();
				})
				.catch((err) => {
					console.error(err);
					tNotif.remove();

					if (err.response.data.errorCode === 'addOrder.no.such.coupon') {
						console.warn('Invalid coupon code');
						notifications.create({
							title: 'Error',
							description: err.response.data.errorMessage,
							type: 'error',
							duration: 4000
						});
						couponCode.set(undefined);
						return;
					}

					// notifications.create({
					// 	title: 'Error',
					// 	description: err.message,
					// 	type: 'error',
					// 	duration: 4000
					// });
				});
		}
	);

	// const total = derived([order, coupons], ([$order, $coupons]) => {
	// 	if (!$order) return null;
	// 	return core.calculateOrderTotal($order, core.carwash.addOns, $coupons);
	// });

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
		saveToLocalStorage([]);
	};

	const submitOrder = async () => {
		// const coupon = get(couponCode);

		// const theOrder = get(order);
		// if (!theOrder) return;

		const theTotal = get(total);
		if (!theTotal) return;

		// const orderWithCoupon = coupon
		//     ? core.orderFns.addCoupon(theOrder, core.couponCode(coupon))
		//     : theOrder;

		const notif = notifications.create({
			title: 'Placing order',
			description: "You'll be redirected to the payment page in a moment.",
			type: 'loading',
			canUserClose: false
		});

		const theCustomer = get(customerStore.customer);
		const patchedCustomer = {
			...theCustomer,
			id: core.customerId(),
			email: core.email(theCustomer.email as unknown as string)
		};
		const orderReq = pricedCreateOrderRequest(
			theTotal,
			patchedCustomer,
			core.fullPaymentOnCheckout()
		);

		try {
			const orderRes = await api.booking.placeOrder(tenant.slug, orderReq);
			console.log(orderRes);

			paymentStore.createPaymentIntent(orderRes.orderId);
			notif.remove();
			goto(routes.checkout.payment());
		} catch (err) {
			console.error('Failed to place order', err);
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
