import { get, writable } from 'svelte/store';
import { defineStep } from './steps';
import { initTimeStores } from './time';
import { getContext, setContext } from 'svelte';
import { initExtras } from './extras';

const BOOKING_STORE_CONTEXT_KEY = Symbol('booking_store');

function createBookingStore(service: Service) {
	const timeStores = initTimeStores(service);
	const extrasStores = initExtras(service);

	// TODO details based on service

	// needed to initialize the steps // TODO find a better way
	const stepsStore = writable<BookingStep[]>([]);

	const steps = {
		timeStep: defineStep<TimeSlot, 'time'>(
			{
				name: 'time',
				valueStore: timeStores.value,
				summaryFunction: (value) =>
					value
						? `${value.day.toLocaleDateString('en-GB', {
								weekday: 'short',
								day: 'numeric',
								month: 'short'
						  })} ${value.start} - ${value.end}`
						: 'no time slot selected'
			},
			stepsStore
		),

		extrasStep: defineStep<Service.Extra[], 'extras'>(
			{
				name: 'extras',
				valueStore: extrasStores.value,
				summaryFunction: (value) => `${value?.length || 'no'} extras selected`
			},
			stepsStore
		),

		detailsStep: defineStep<Service.Details, 'details'>(
			{
				name: 'details',
				valueStore: writable(null) // TODO proper value store
			},
			stepsStore
		)
		// TODO custom steps
	};

	// Open the first step
	get(stepsStore)?.[0].onOpen();

	return {
		steps,
		timeStores,
		extrasStores
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
