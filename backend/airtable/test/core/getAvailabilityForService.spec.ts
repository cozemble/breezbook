import { expect, test } from 'vitest';
import { getAvailabilityForService } from '../../src/core/getAvailabilityForService.js';
import { everythingForTenant } from '../../src/express/getEverythingForTenant.js';
import {
	booking,
	Booking,
	businessAvailability,
	businessConfiguration,
	currency,
	customerId,
	dayAndTimePeriod,
	duration,
	environmentId,
	isoDate,
	periodicStartTime,
	price,
	resource,
	resourceDayAvailability,
	resourceType,
	service,
	serviceId,
	tenantEnvironment,
	tenantId,
	tenantSettings,
	time24,
	timePeriod,
	timeslotSpec
} from '@breezbook/packages-core';

const van = resourceType('van');
const van1 = resource(van, 'Van 1');
const aService = service('Service One', 'Service One', [van], 60, true, price(1000, currency('GBP')), [], []);
const today = isoDate();
const theOnlyTimeslotWeHave = timeslotSpec(time24('09:00'), time24('10:00'), 'Morning');

test('if resource is available and there are no bookings, then we have service availability', () => {
	const availability = getAvailabilityForService(makeEverythingForTenant([]), aService.id, today, today);
	expect(availability).toBeDefined();
	expect(availability.slots[today.value]).toBeDefined();
	expect(availability.slots[today.value]).toHaveLength(1);
});

test('if resource is available but there is a booking, then we have no service availability', () => {
	const theBooking = booking(customerId('customer#1'), aService.id, today, theOnlyTimeslotWeHave);
	const availability = getAvailabilityForService(makeEverythingForTenant([theBooking]), aService.id, today, today);
	expect(availability).toBeDefined();
	expect(availability.slots[today.value]).toBeUndefined();
});

test('cancelled bookings do not count against availability', () => {
	const theBooking = { ...booking(customerId('customer#1'), aService.id, today, theOnlyTimeslotWeHave), status: 'cancelled' };
	const availability = getAvailabilityForService(makeEverythingForTenant([theBooking]), aService.id, today, today);
	expect(availability).toBeDefined();
	expect(availability.slots[today.value]).toBeDefined();
	expect(availability.slots[today.value]).toHaveLength(1);
});

function makeEverythingForTenant(bookings: Booking[]) {
	return everythingForTenant(
		businessConfiguration(
			businessAvailability([dayAndTimePeriod(today, timePeriod(time24('09:00'), time24('18:00')))]),
			[resourceDayAvailability(van1, [dayAndTimePeriod(today, timePeriod(time24('09:00'), time24('18:00')))])],
			[aService],
			[],
			[theOnlyTimeslotWeHave],
			[],
			periodicStartTime(duration(90)),
			null
		),
		[],
		bookings,
		[],
		tenantSettings(null),
		tenantEnvironment(environmentId('dev'), tenantId('tenant#1'))
	);
}
