import { get, writable } from 'svelte/store';
import api from '$lib/common/api';
import tenantStore from '../tenant';
import { locationStore } from '../location';

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
export default function createTimeStore(service: Service) {
	const tenant = tenantStore.get();
	const tenantLocation = locationStore.get();

	const daySlots = writable<DaySlot[]>([]);
	const filters = writable<TimeSlotFilter>(DEFAULT_TIME_SLOT_FILTER);
	const value = writable<TimeSlot | null>(null);
	const loading = writable(false);

	const fetchTimeSlots = async () => {
		loading.set(true);

		const res = await api.booking.getTimeSlots(
			tenant.slug,
			tenantLocation.id,
			service.id,
			get(filters)
		);
		daySlots.set(res);

		loading.set(false);
	};

	// fetch time slots initially
	fetchTimeSlots();

	// re-fetch time slots when filters change
	filters.subscribe((filters) => {
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
