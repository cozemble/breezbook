import { derived, get } from 'svelte/store';
import { goto } from '$app/navigation';

import { defineStep } from './stepHelper';
import createTimeStore from './time';
import createExtrasStore from './extras';
import createDetailsStore from './details';
import checkoutStore from '../checkout';
import { createStoreContext } from '$lib/common/helpers/store';
import routeStore from '../routes';

const BOOKING_STORE_CONTEXT_KEY = 'booking_store';

/** Initialize the stores and their steps to use for booking
 * - Stores are created with their functions
 * - Steps are provided withing the store object
 * - There are 3 default steps: time, extras, details
 */
function createBookingStore(service: Service) {
	const checkout = checkoutStore.get();
	const routes = routeStore.get();

	const timeStore = createTimeStore(service);
	const extrasStore = createExtrasStore(service);
	const detailsStore = createDetailsStore(service);

	const total = derived([timeStore.value, extrasStore.value], ([$time, $extras]) => {
		const timePrice = $time?.price || 0;
		const extrasPrice = $extras.reduce((acc, extra) => acc + extra.price, 0);

		return timePrice + extrasPrice;
	});

	// TODO custom steps

	/** Save the booking to cart and redirect to cart page */
	const finish = async () => {
		// TODO check if steps are valid

		// get all values
		const values = {
			time: get(timeStore.value) as TimeSlot, // TODO fix typing
			extras: get(extrasStore.value),
			details: get(detailsStore.value)
		};

		// save to cart
		checkout.addItem({
			service: service,
			calculatedPrice: get(total), // TODO calculate price
			...values
		});

		// redirect to cart // TODO make this a global function (probably as a navigate util)
		goto(routes.checkout.main());
	};

	return {
		time: {
			...timeStore,
			step: defineStep()
		},

		extras: {
			...extrasStore,
			step: defineStep()
		},

		details: {
			...detailsStore,
			step: defineStep()
		},

		total,
		finish
	};
}

//

const bookingStore = createStoreContext(BOOKING_STORE_CONTEXT_KEY, createBookingStore);

export default bookingStore;
