import { get, writable } from 'svelte/store';
import api from '$lib/common/api';

type TimeSlotFilter = {
	fromDate: Date;
	toDate: Date;
};

const DEFAULT_TIME_SLOT_FILTER: TimeSlotFilter = {
	fromDate: new Date(),
	toDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
};

const isSlotWithinFilters = (slot: TimeSlot, filter: TimeSlotFilter) => {
	const slotDate = new Date(slot.start);
	const fromDate = new Date(filter.fromDate);
	const toDate = new Date(filter.toDate);

	return fromDate <= slotDate && slotDate <= toDate;
};

/** Setup stores to manage time slots
 * - fetch time slots initially
 * - re-fetch time slots when filters change
 * - manage selected time slot
 */
export function initTimeStores(service: Service) {
	const daySlots = writable<DaySlot[]>([]);
	const timeSlotFilters = writable<TimeSlotFilter>(DEFAULT_TIME_SLOT_FILTER);
	const selectedSlot = writable<TimeSlot | null>(null);
	const loading = writable(false);

	const fetchTimeSlots = async () => {
		loading.set(true);

		console.log('fetching time slots');

		const filters = get(timeSlotFilters);
		const res = await api.timeSlot.getAll('', '', filters); // TODO proper params
		daySlots.set(res);

		console.log('fetched time slots', res);

		loading.set(false);
	};

	// fetch time slots initially
	fetchTimeSlots();

	// re-fetch time slots when filters change
	timeSlotFilters.subscribe((filters) => {
		fetchTimeSlots();

		// if the selected slot is not within the filters, clear it
		const slot = get(selectedSlot);
		if (slot && !isSlotWithinFilters(slot, filters)) selectedSlot.set(null);
	});

	return {
		daySlots,
		timeSlotFilters,
		selectedSlot,
		loading
	};
}
