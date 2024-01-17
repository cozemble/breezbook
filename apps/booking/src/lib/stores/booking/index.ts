import { get } from 'svelte/store';
import { initSteps } from './steps';
import { initTimeStores } from './time';
import { getContext, setContext } from 'svelte';

const BOOKING_STORE_CONTEXT_KEY = Symbol('booking_store');

function createBookingStore(service: Service) {
	const steps = initSteps();

	const timeStores = initTimeStores(service);

	// TODO this is horrible, find a better way
	// sync time step value with selected slot
	timeStores.selectedSlot.subscribe((slot) => {
		const stepValue = get(steps.timeStep.value);

		console.log('selected slot', slot);

		if (stepValue !== slot) steps.timeStep.value.set(slot);
	});

	steps.timeStep.value.subscribe((slot) => {
		const timeStoreValue = get(timeStores.selectedSlot);

		console.log('time step value', slot);

		if (timeStoreValue !== slot) timeStores.selectedSlot.set(slot);
	});

	// TODO get extras based on service
	// TODO get customer details based on service

	return {
		steps,
		timeStores
	};
}

export function initBookingStore(service: Service) {
	const bookingStore = createBookingStore(service);

	setContext(BOOKING_STORE_CONTEXT_KEY, bookingStore);

	return bookingStore;
}

export function getBookingStore() {
	type BookingStore = ReturnType<typeof createBookingStore>;

	const store = getContext<BookingStore | null>(BOOKING_STORE_CONTEXT_KEY);

	if (!store)
		throw new Error(
			'Booking store not initialized, initialize with initBookingStore() in the root component of booking'
		);

	return store;
}
