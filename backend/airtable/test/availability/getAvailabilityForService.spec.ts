import { beforeEach, describe, expect, test } from 'vitest';
import {
	bookedServiceOption,
	Booking,
	booking,
	carwash,
	customerId,
	Service,
	serviceFns,
	ServiceOption,
	serviceOptionFns
} from '@breezbook/packages-core';
import { everythingForCarWashTenantWithDynamicPricing } from '../helper.js';
import { capacity, mandatory, serviceId, serviceOptionId, serviceOptionRequest } from '@breezbook/packages-types';
import { PrismockClient } from 'prismock';
import { dogWalkingTenant, loadDogWalkingTenant } from '../../src/dx/loadDogWalkingTenant.js';
import { EverythingForAvailability } from '../../src/express/getEverythingForAvailability.js';
import { serviceAvailabilityRequest } from '../../src/express/availability/getServiceAvailabilityForLocation.js';
import { PrismaClient } from '@prisma/client';
import { AvailabilityResponse, availabilityResponseFns } from '@breezbook/backend-api-types';
import { getAvailabilityForService } from '../../src/availability/getAvailabilityForService.js';
import { byLocation } from '../../src/availability/byLocation.js';
import { isoDate, isoDateFns, time24, timePeriod, timezones } from '@breezbook/packages-date-time';


const today = isoDateFns.today(timezones.utc);
const theOnlyTimeslotWeHave = carwash.nineToOne;

test('if resource is available and there are no bookings, then we have service availability', () => {
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([]), serviceAvailabilityRequest(carwash.smallCarWash.id, today, today));
	expect(availabilityResponseFns.slotsForDate(availability, today)).toHaveLength(3);
});

test('if some but not all resources are assigned to a timeslot, then we still have service availability for that timeslot', () => {
	const bookingForVan1 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot);
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([bookingForVan1]), serviceAvailabilityRequest(carwash.smallCarWash.id, today, today));
	expect(availabilityResponseFns.slotsForDate(availability, today)).toHaveLength(3);
});

test('if all resources are assigned to a timeslot, then we have no service availability for that timeslot', () => {
	const bookingForVan1 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot);
	const bookingForVan2 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot);
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([bookingForVan1, bookingForVan2]), serviceAvailabilityRequest(carwash.smallCarWash.id, today, today));
	expect(availabilityResponseFns.slotsForDate(availability, today)).toHaveLength(2);
});

test('cancelled bookings do not count against availability', () => {
	const theBooking: Booking = {
		...booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot),
		status: 'cancelled'
	};
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([theBooking]), serviceAvailabilityRequest(carwash.smallCarWash.id, today, today));
	expect(availabilityResponseFns.slotsForDate(availability, today)).toHaveLength(3);
});

test('pricing can be dynamic', () => {
	const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([]), serviceAvailabilityRequest(carwash.smallCarWash.id, today, today));
	const slots = availabilityResponseFns.slotsForDate(availability, today);
	expect(slots[0]?.priceWithNoDecimalPlaces).toBe(1400);
});

describe('given a service with service options', () => {
	let prismock: PrismaClient;
	let everythingForAvailability: EverythingForAvailability;
	let individualDogWalk: Service;
	let groupDogWalk: Service;
	let extra60Mins: ServiceOption;
	let extra30Mins: ServiceOption;
	let extraDog: ServiceOption;
	const saturday = isoDate('2024-07-13');

	beforeEach(async () => {
		prismock = new PrismockClient();
		await loadDogWalkingTenant(prismock);
		everythingForAvailability = await byLocation.getEverythingForAvailability(prismock, dogWalkingTenant.tenantEnvLoc, saturday, saturday);
		individualDogWalk = serviceFns.findService(everythingForAvailability.businessConfiguration.services, serviceId(dogWalkingTenant.serviceIds.individualDogWalk));
		groupDogWalk = serviceFns.findService(everythingForAvailability.businessConfiguration.services, serviceId(dogWalkingTenant.serviceIds.groupDogWalk));
		extra60Mins = serviceOptionFns.findServiceOption(everythingForAvailability.businessConfiguration.serviceOptions, serviceOptionId(dogWalkingTenant.serviceOptions.extra60Mins));
		extra30Mins = serviceOptionFns.findServiceOption(everythingForAvailability.businessConfiguration.serviceOptions, serviceOptionId(dogWalkingTenant.serviceOptions.extra30Mins));
		extraDog = serviceOptionFns.findServiceOption(everythingForAvailability.businessConfiguration.serviceOptions, serviceOptionId(dogWalkingTenant.serviceOptions.extraDog));
	});

	test('service options that extend the service\'s duration are reflected in availability', async () => {
		const availabilityWithoutOptions = getAvailabilityForService(everythingForAvailability, serviceAvailabilityRequest(individualDogWalk.id, saturday, saturday, [])) as AvailabilityResponse;
		expect(availabilityWithoutOptions).toBeDefined();
		expect(availabilityWithoutOptions.slots[saturday.value]).toBeDefined();
		expect(availabilityWithoutOptions.slots[saturday.value]).toHaveLength(9);

		const availabilityWithExtra60Mins = getAvailabilityForService(everythingForAvailability, serviceAvailabilityRequest(individualDogWalk.id, saturday, saturday, [], [], [serviceOptionRequest(extra60Mins.id)])) as AvailabilityResponse;
		expect(availabilityWithExtra60Mins).toBeDefined();
		expect(availabilityWithExtra60Mins.slots[saturday.value]).toBeDefined();
		expect(availabilityWithExtra60Mins.slots[saturday.value]).toHaveLength(7);
	});

	test('price breakdown shows service price and option prices', () => {
		const availabilityWithTwoExtras = getAvailabilityForService(everythingForAvailability,
			serviceAvailabilityRequest(individualDogWalk.id, saturday, saturday, [], [], [
				serviceOptionRequest(extra30Mins.id),
				serviceOptionRequest(extra60Mins.id, 2)])) as AvailabilityResponse;
		const slotsToday = availabilityResponseFns.slotsForDate(availabilityWithTwoExtras, saturday);
		const firstSlot = mandatory(slotsToday[0], 'No slots for ' + saturday.value);
		expect(firstSlot.priceBreakdown.servicePrice).toBe(dogWalkingTenant.servicePrices.individualDogWalk + 500);
		expect(firstSlot.priceBreakdown.pricedOptions).toHaveLength(2);

		expect(firstSlot.priceBreakdown?.pricedOptions?.[0]?.serviceOptionId).toBe(extra30Mins.id.value);
		expect(firstSlot.priceBreakdown?.pricedOptions?.[0]?.unitPrice).toBe(dogWalkingTenant.serviceOptionPrices.extra30Mins);
		expect(firstSlot.priceBreakdown?.pricedOptions?.[0]?.quantity).toBe(1);
		expect(firstSlot.priceBreakdown?.pricedOptions?.[0]?.price).toBe(dogWalkingTenant.serviceOptionPrices.extra30Mins);

		expect(firstSlot.priceBreakdown?.pricedOptions?.[1]?.serviceOptionId).toBe(extra60Mins.id.value);
		expect(firstSlot.priceBreakdown?.pricedOptions?.[1]?.unitPrice).toBe(dogWalkingTenant.serviceOptionPrices.extra60Mins);
		expect(firstSlot.priceBreakdown?.pricedOptions?.[1]?.quantity).toBe(2);
		expect(firstSlot.priceBreakdown?.pricedOptions?.[1]?.price).toBe(dogWalkingTenant.serviceOptionPrices.extra60Mins * 2);
	});

	test('group dog walking is capacity based', () => {
		const availabilityWithoutOptions = getAvailabilityForService(everythingForAvailability, serviceAvailabilityRequest(groupDogWalk.id, saturday, saturday, [])) as AvailabilityResponse;
		expect(availabilityWithoutOptions).toBeDefined();
		expect(availabilityWithoutOptions.slots[saturday.value]).toBeDefined();
		expect(availabilityWithoutOptions.slots[saturday.value]).toHaveLength(2);

		const groupBooking1 = booking(customerId('customer#1'), groupDogWalk, saturday, timePeriod(time24('09:00'), time24('10:00')));
		const groupBooking2 = booking(customerId('customer#2'), groupDogWalk, saturday, timePeriod(time24('09:00'), time24('10:00')));
		const groupBooking3 = booking(customerId('customer#3'), groupDogWalk, saturday, timePeriod(time24('09:00'), time24('10:00')));
		const groupBooking4 = booking(customerId('customer#4'), groupDogWalk, saturday, timePeriod(time24('09:00'), time24('10:00')));
		const groupBooking5 = booking(customerId('customer#5'), groupDogWalk, saturday, timePeriod(time24('09:00'), time24('10:00')));

		const withOneBooking = { ...everythingForAvailability, bookings: [groupBooking1] };
		const availabilityWithOneBooking = getAvailabilityForService(withOneBooking, serviceAvailabilityRequest(groupDogWalk.id, saturday, saturday, [])) as AvailabilityResponse;
		expect(availabilityWithOneBooking).toBeDefined();
		expect(availabilityWithOneBooking.slots[saturday.value]).toBeDefined();
		expect(availabilityWithOneBooking.slots[saturday.value]).toHaveLength(2);

		const withFiveBookings = {
			...everythingForAvailability,
			bookings: [groupBooking1, groupBooking2, groupBooking3, groupBooking4, groupBooking5]
		};
		const availabilityWithFiveBookings = getAvailabilityForService(withFiveBookings, serviceAvailabilityRequest(groupDogWalk.id, saturday, saturday, [])) as AvailabilityResponse;
		expect(availabilityWithFiveBookings).toBeDefined();
		expect(availabilityWithFiveBookings.slots[saturday.value]).toBeDefined();
		expect(availabilityWithFiveBookings.slots[saturday.value]).toHaveLength(1);
	});

	test('booked capacity counts against slot capacity', () => {
		const groupBooking1 = booking(customerId('customer#1'), groupDogWalk, saturday, timePeriod(time24('09:00'), time24('10:00')), [], [], capacity(5));
		const withOneBooking = { ...everythingForAvailability, bookings: [groupBooking1] };
		const availabilityWithOneBooking = getAvailabilityForService(withOneBooking, serviceAvailabilityRequest(groupDogWalk.id, saturday, saturday, [])) as AvailabilityResponse;
		expect(availabilityWithOneBooking).toBeDefined();
		expect(availabilityWithOneBooking.slots[saturday.value]).toBeDefined();
		expect(availabilityWithOneBooking.slots[saturday.value]).toHaveLength(1);
	});

	test('attempting to book more capacity than the service allows is an error', () => {
		// booking capacity on its own
		// service option capacity on its own
		// the sum of the two
		// expect("status").toBe("done")
	});

	test('service option quantity counts against slot capacity', () => {
		const groupBooking1 = booking(customerId('customer#1'), groupDogWalk, saturday, timePeriod(time24('09:00'), time24('10:00')), [], [bookedServiceOption(extraDog, 4)]);
		const withOneBooking = { ...everythingForAvailability, bookings: [groupBooking1] };
		const availabilityWithOneBooking = getAvailabilityForService(withOneBooking, serviceAvailabilityRequest(groupDogWalk.id, saturday, saturday)) as AvailabilityResponse;
		expect(availabilityWithOneBooking).toBeDefined();
		expect(availabilityWithOneBooking.slots[saturday.value]).toBeDefined();
		expect(availabilityWithOneBooking.slots[saturday.value]).toHaveLength(1);
	});
});
