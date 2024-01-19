import { defineStep } from './stepHelper';
import { createTimeStore } from './time';
import { getContext, setContext } from 'svelte';
import { createExtrasStore } from './extras';
import { createDetailsStore } from './details';

const BOOKING_STORE_CONTEXT_KEY = Symbol('booking_store');

/** Initialize the stores and their steps to use for booking
 * - Stores are created with their functions
 * - Steps are provided withing the store object
 * - There are 3 default steps: time, extras, details
 */
function createBookingStore(service: Service) {
	const timeStore = createTimeStore(service);
	const extrasStore = createExtrasStore(service);
	const detailsStore = createDetailsStore(service);

	// TODO custom steps

	return {
		time: {
			...timeStore,
			step: defineStep<TimeSlot, 'time'>({
				name: 'time',
				valueStore: timeStore.value,
				summaryFunction: (value) =>
					value
						? `${value.day.toLocaleDateString('en-GB', {
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
		}
	};
}

/** Store to keep the logic of the booking multi step form
 * - Each step is defined as the property of this object
 * - Step logic of each step is included in the `step` property of each step
 */
type BookingStore = ReturnType<typeof createBookingStore>;

/** ## Make sure this is called in the booking root component
 * Initializes the booking store and sets it in the context */
export function initBookingStore(service: Service) {
	const bookingStore = createBookingStore(service);

	setContext(BOOKING_STORE_CONTEXT_KEY, bookingStore);

	return bookingStore;
}

/** Gets the booking store from the context
 * @throws if the store is not initialized
 */
export function getBookingStore() {
	const store = getContext<BookingStore | null>(BOOKING_STORE_CONTEXT_KEY);
	if (!store)
		throw new Error(
			'Booking store not initialized, initialize with initBookingStore() in the root component of booking'
		);

	return store;
}
