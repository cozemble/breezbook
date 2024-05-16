import { derived, get, writable, type Writable } from 'svelte/store';

import type { AvailabilityResponse } from '@breezbook/backend-api-types';

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
export default function createTimeStore(
	availabilityResponse: Writable<AvailabilityResponse | null>,
	fetchAvailability: (filters: TimeSlotFilter) => void
) {
	const daySlots = derived(availabilityResponse, ($res) => {
		if (!$res) return [];

		const adaptedDays: DaySlot[] = Object.entries($res.slots).reduce((prev, [key, value]) => {
			const timeSlots: TimeSlot[] = value.map((slot) => ({
				id: slot.timeslotId,
				start: slot.startTime24hr,
				end: slot.endTime24hr,
				price: slot.priceWithNoDecimalPlaces,
				day: key
			}));
			const day: DaySlot = { date: key, timeSlots };

			return [...prev, day];
		}, [] as DaySlot[]);

		loading.set(false);
		return adaptedDays;
	});

	const filters = writable<TimeSlotFilter>(DEFAULT_TIME_SLOT_FILTER);
	const value = writable<TimeSlot | null>(null);
	const loading = writable(true);

	const fetchTimeSlots = async () => {
		loading.set(true);

		await fetchAvailability(get(filters));

		loading.set(false);
	};

	// re-fetch time slots when filters change
	filters.subscribe((filters) => {
		if (filters === DEFAULT_TIME_SLOT_FILTER) return; // skip initial value because it's already fetched by onMount

		fetchTimeSlots();

		// if the selected slot is not within the filters, clear it
		const selected = get(value);
		if (selected && !isSlotWithinFilters(selected, filters)) value.set(null);
	});

	return {
		daySlots,
		filters,
		value,
		loading
	};
}
