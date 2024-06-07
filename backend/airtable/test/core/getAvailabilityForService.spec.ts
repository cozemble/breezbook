import { expect, test } from 'vitest';
import { getAvailabilityForService } from '../../src/core/getAvailabilityForService.js';
import {Booking, booking, carwash, customerId, isoDate} from '@breezbook/packages-core';
import { everythingForCarWashTenantWithDynamicPricing } from '../helper.js';

const today = isoDate();
const theOnlyTimeslotWeHave = carwash.nineToOne;

test('if resource is available and there are no bookings, then we have service availability', () => {
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([]), carwash.smallCarWash.id, today, today);
	expect(availability).toBeDefined();
	expect(availability.slots[today.value]).toBeDefined();
	expect(availability.slots[today.value]).toHaveLength(3);
});

test('if some but not all resources are assigned to a timeslot, then we still have service availability for that timeslot', () => {
	const bookingForVan1 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave, []);
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([bookingForVan1]), carwash.smallCarWash.id, today, today);
	expect(availability).toBeDefined();
	expect(availability.slots[today.value]).toBeDefined();
	expect(availability.slots[today.value]).toHaveLength(3);
});

test('if all resources are assigned to a timeslot, then we have no service availability for that timeslot', () => {
	const bookingForVan1 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave, []);
	const bookingForVan2 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave, []);
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([bookingForVan1, bookingForVan2]), carwash.smallCarWash.id, today, today);
	expect(availability).toBeDefined();
	expect(availability.slots[today.value]).toBeDefined();
	expect(availability.slots[today.value]).toHaveLength(2);
});

test('cancelled bookings do not count against availability', () => {
	const theBooking:Booking = {
		...booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave, []),
		status: 'cancelled'
	};
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([theBooking]), carwash.smallCarWash.id, today, today);
	expect(availability).toBeDefined();
	expect(availability.slots[today.value]).toBeDefined();
	expect(availability.slots[today.value]).toHaveLength(3);
});

test('pricing can be dynamic', () => {
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([]), carwash.smallCarWash.id, today, today);
	expect(availability.slots[today.value][0].priceWithNoDecimalPlaces).toBe(1400);
});
