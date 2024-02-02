import { get } from 'svelte/store';
import { goto } from '$app/navigation';

import { defineStep } from './stepHelper';
import createTimeStore from './time';
import createExtrasStore from './extras';
import createDetailsStore from './details';
import checkoutStore from '../checkout';
import { createStoreContext } from '$lib/helpers/store';

const BOOKING_STORE_CONTEXT_KEY = 'booking_store';

/** Initialize the stores and their steps to use for booking
 * - Stores are created with their functions
 * - Steps are provided withing the store object
 * - There are 3 default steps: time, extras, details
 */
function createBookingStore(service: Service) {
	const checkout = checkoutStore.get();

	const timeStore = createTimeStore(service);
	const extrasStore = createExtrasStore(service);
	const detailsStore = createDetailsStore(service);

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
			calculatedPrice: service.approximatePrice * 100, // TODO calculate price
			...values
		});

		// redirect to cart // TODO make this a global function (probably as a navigate util)
		goto(`/checkout`);
	};

	return {
		time: {
			...timeStore,
			step: defineStep<TimeSlot, 'time'>({
				name: 'time',
				valueStore: timeStore.value,
				summaryFunction: (value) =>
					value
						? `${new Date(value.day).toLocaleDateString('en-GB', {
								weekday: 'short',
								day: 'numeric',
								month: 'short'
						  })} ${value.start} - ${value.end}`
						: 'no time slot selected'
			})
		},

		extras: {
			...extrasStore,
			step: defineStep<Service.Extra[], 'extras'>({
				name: 'extras',
				valueStore: extrasStore.value,
				summaryFunction: (value) => `${value?.length || 'no'} extras selected`
			})
		},

		details: {
			...detailsStore,
			step: defineStep<Service.Details, 'details'>({
				name: 'details',
				valueStore: detailsStore.value
			})
		},

		finish
	};
}

//

const bookingStore = createStoreContext(BOOKING_STORE_CONTEXT_KEY, createBookingStore);

export default bookingStore;
