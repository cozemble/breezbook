import { get, writable } from 'svelte/store';
import { defineStep } from './steps';
import { createTimeStore } from './time';
import { getContext, setContext } from 'svelte';
import { createExtrasStore } from './extras';
import { createDetailsStore } from './details';

const BOOKING_STORE_CONTEXT_KEY = Symbol('booking_store');

function createBookingStore(service: Service) {
	const timeStore = createTimeStore(service);
	const extrasStore = createExtrasStore(service);
	const detailsStore = createDetailsStore(service);

	// TODO details based on service

	// needed to initialize the steps // TODO find a better way

	const steps = {
		timeStep: defineStep<TimeSlot, 'time'>({
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
		}),

		extrasStep: defineStep<Service.Extra[], 'extras'>({
			name: 'extras',
			valueStore: extrasStore.value,
			summaryFunction: (value) => `${value?.length || 'no'} extras selected`
		}),

		detailsStep: defineStep<Service.Details, 'details'>({
			name: 'details',
			valueStore: detailsStore.value // TODO proper value store
		})

		// TODO custom steps
	};

	// Open the first step
	steps.timeStep.onOpen();

	return {
		steps,
		timeStore,
		extrasStore,
		detailsStore
	};
}

/** Initializes the booking store and sets it in the context */
export function initBookingStore(service: Service) {
	const bookingStore = createBookingStore(service);

	setContext(BOOKING_STORE_CONTEXT_KEY, bookingStore);

	return bookingStore;
}

/** Gets the booking store from the context
 * @throws if the store is not initialized
 */
export function getBookingStore() {
	type BookingStore = ReturnType<typeof createBookingStore>;

	const store = getContext<BookingStore | null>(BOOKING_STORE_CONTEXT_KEY);

	if (!store)
		throw new Error(
			'Booking store not initialized, initialize with initBookingStore() in the root component of booking'
		);

	return store;
}
