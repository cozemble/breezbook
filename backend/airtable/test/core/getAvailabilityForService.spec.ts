import {expect, test} from 'vitest';
import {Booking, booking, carwash, customerId} from '@breezbook/packages-core';
import {everythingForCarWashTenantWithDynamicPricing} from '../helper.js';
import {getAvailabilityForService} from "../../src/core/getAvailabilityForService.js";
import {isoDate, mandatory, serviceOptionRequest} from "@breezbook/packages-types";
import {PrismockClient} from "prismock";
import {dogWalkingTenant, loadDogWalkingTenant} from "../../src/dx/loadDogWalkingTenant.js";
import {getEverythingForAvailability} from "../../src/express/getEverythingForAvailability.js";


const today = isoDate();
const theOnlyTimeslotWeHave = carwash.nineToOne;

test('if resource is available and there are no bookings, then we have service availability', () => {
    const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([]), carwash.smallCarWash.id, [], today, today);
    expect(availability).toBeDefined();
    expect(availability.slots[today.value]).toBeDefined();
    expect(availability.slots[today.value]).toHaveLength(3);
});

test('if some but not all resources are assigned to a timeslot, then we still have service availability for that timeslot', () => {
    const bookingForVan1 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot);
    const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([bookingForVan1]), carwash.smallCarWash.id, [], today, today);
    expect(availability).toBeDefined();
    expect(availability.slots[today.value]).toBeDefined();
    expect(availability.slots[today.value]).toHaveLength(3);
});

test('if all resources are assigned to a timeslot, then we have no service availability for that timeslot', () => {
    const bookingForVan1 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot);
    const bookingForVan2 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot);
    const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([bookingForVan1, bookingForVan2]), carwash.smallCarWash.id, [], today, today);
    expect(availability).toBeDefined();
    expect(availability.slots[today.value]).toBeDefined();
    expect(availability.slots[today.value]).toHaveLength(2);
});

test('cancelled bookings do not count against availability', () => {
    const theBooking: Booking = {
        ...booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot),
        status: 'cancelled'
    };
    const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([theBooking]), carwash.smallCarWash.id, [], today, today);
    expect(availability).toBeDefined();
    expect(availability.slots[today.value]).toBeDefined();
    expect(availability.slots[today.value]).toHaveLength(3);
});

test('pricing can be dynamic', () => {
    const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([]), carwash.smallCarWash.id, [], today, today);
    expect(availability.slots[today.value]?.[0]?.priceWithNoDecimalPlaces).toBe(1400);
});

test("service options that extend the service's duration are reflected in availability", async () => {
    const prismock = new PrismockClient();
    await loadDogWalkingTenant(prismock);
    const everythingForAvailability = await getEverythingForAvailability(prismock, dogWalkingTenant.tenantEnv, today, today);
    const individualDogWalk = mandatory(everythingForAvailability.businessConfiguration.services.find(s => s.id.value === dogWalkingTenant.services.individualDogWalk), 'individual dog walk not found');
    const extra60Mins = mandatory(everythingForAvailability.businessConfiguration.serviceOptions.find(so => so.id.value === dogWalkingTenant.serviceOptions.extra60Mins), 'extra 60 mins not found');

    const availabilityWithoutOptions = getAvailabilityForService(everythingForAvailability, individualDogWalk.id, [], today, today);
    expect(availabilityWithoutOptions).toBeDefined();
    expect(availabilityWithoutOptions.slots[today.value]).toBeDefined();
    expect(availabilityWithoutOptions.slots[today.value]).toHaveLength(17);

    const availabilityWithExtra60Mins = getAvailabilityForService(everythingForAvailability, individualDogWalk.id, [serviceOptionRequest(extra60Mins.id)], today, today);
    expect(availabilityWithExtra60Mins).toBeDefined();
    expect(availabilityWithExtra60Mins.slots[today.value]).toBeDefined();
    expect(availabilityWithExtra60Mins.slots[today.value]).toHaveLength(15);
})
