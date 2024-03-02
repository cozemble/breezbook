import { expect, test } from 'vitest';
import { getAvailabilityForService } from '../../src/core/getAvailabilityForService.js';
import { booking, carwash, customerId, isoDate } from '@breezbook/packages-core';
import { everythingForCarWashTenantWithDynamicPricing } from '../helper.js';

const today = isoDate();
const theOnlyTimeslotWeHave = carwash.nineToOne;

test('if resource is available and there are no bookings, then we have service availability', () => {
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([]), carwash.smallCarWash.id, today, today);
	expect(availability).toBeDefined();
	expect(availability.slots[today.value]).toBeDefined();
	expect(availability.slots[today.value]).toHaveLength(3);
});

test('if resource is available but there is a booking, then we have no service availability', () => {
	const theBooking = booking(customerId('customer#1'), carwash.smallCarWash.id, today, theOnlyTimeslotWeHave);
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([theBooking]), carwash.smallCarWash.id, today, today);
	expect(availability).toBeDefined();
	expect(availability.slots[today.value]).toBeDefined();
	expect(availability.slots[today.value]).toHaveLength(2);
});

test('cancelled bookings do not count against availability', () => {
	const theBooking = {
		...booking(customerId('customer#1'), carwash.smallCarWash.id, today, theOnlyTimeslotWeHave),
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
