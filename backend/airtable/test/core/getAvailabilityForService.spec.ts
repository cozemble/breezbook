import {beforeEach, describe, expect, test} from 'vitest';
import {
    Booking,
    booking,
    carwash,
    customerId,
    Service,
    serviceFns,
    ServiceOption,
    serviceOptionFns
} from '@breezbook/packages-core';
import {everythingForCarWashTenantWithDynamicPricing} from '../helper.js';
import {getAvailabilityForService} from "../../src/core/getAvailabilityForService.js";
import {isoDate, mandatory, serviceId, serviceOptionId, serviceOptionRequest} from "@breezbook/packages-types";
import {PrismockClient} from "prismock";
import {dogWalkingTenant, loadDogWalkingTenant} from "../../src/dx/loadDogWalkingTenant.js";
import {
    EverythingForAvailability,
    getEverythingForAvailability
} from "../../src/express/getEverythingForAvailability.js";
import {serviceAvailabilityRequest} from "../../src/express/availability/getServiceAvailabilityForLocation.js";
import {PrismaClient} from "@prisma/client";
import {AvailabilityResponse, availabilityResponseFns} from "@breezbook/backend-api-types";


const today = isoDate();
const theOnlyTimeslotWeHave = carwash.nineToOne;

test('if resource is available and there are no bookings, then we have service availability', () => {
    const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([]), serviceAvailabilityRequest(carwash.smallCarWash.id, today, today));
    expect(availability).toBeDefined();
    expect(availability.slots[today.value]).toBeDefined();
    expect(availability.slots[today.value]).toHaveLength(3);
});

test('if some but not all resources are assigned to a timeslot, then we still have service availability for that timeslot', () => {
    const bookingForVan1 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot);
    const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([bookingForVan1]), serviceAvailabilityRequest(carwash.smallCarWash.id, today, today));
    expect(availability).toBeDefined();
    expect(availability.slots[today.value]).toBeDefined();
    expect(availability.slots[today.value]).toHaveLength(3);
});

test('if all resources are assigned to a timeslot, then we have no service availability for that timeslot', () => {
    const bookingForVan1 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot);
    const bookingForVan2 = booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot);
    const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([bookingForVan1, bookingForVan2]), serviceAvailabilityRequest(carwash.smallCarWash.id, today, today));
    expect(availability).toBeDefined();
    expect(availability.slots[today.value]).toBeDefined();
    expect(availability.slots[today.value]).toHaveLength(2);
});

test('cancelled bookings do not count against availability', () => {
    const theBooking: Booking = {
        ...booking(customerId('customer#1'), carwash.smallCarWash, today, theOnlyTimeslotWeHave.slot),
        status: 'cancelled'
    };
    const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([theBooking]), serviceAvailabilityRequest(carwash.smallCarWash.id, today, today));
    expect(availability).toBeDefined();
    expect(availability.slots[today.value]).toBeDefined();
    expect(availability.slots[today.value]).toHaveLength(3);
});

test('pricing can be dynamic', () => {
    const availability = getAvailabilityForService(everythingForCarWashTenantWithDynamicPricing([]), serviceAvailabilityRequest(carwash.smallCarWash.id, today, today));
    expect(availability.slots[today.value]?.[0]?.priceWithNoDecimalPlaces).toBe(1400);
});

describe("given a service with service options", () => {
    let prismock: PrismaClient;
    let everythingForAvailability: EverythingForAvailability;
    let individualDogWalk: Service;
    let extra60Mins: ServiceOption;
    let extra30Mins: ServiceOption;
    const saturday = isoDate("2024-07-13");

    beforeEach(async () => {
        prismock = new PrismockClient();
        await loadDogWalkingTenant(prismock);
        everythingForAvailability = await getEverythingForAvailability(prismock, dogWalkingTenant.tenantEnv, saturday, saturday);
        individualDogWalk = serviceFns.findService(everythingForAvailability.businessConfiguration.services, serviceId(dogWalkingTenant.serviceIds.individualDogWalk));
        extra60Mins = serviceOptionFns.findServiceOption(everythingForAvailability.businessConfiguration.serviceOptions, serviceOptionId(dogWalkingTenant.serviceOptions.extra60Mins));
        extra30Mins = serviceOptionFns.findServiceOption(everythingForAvailability.businessConfiguration.serviceOptions, serviceOptionId(dogWalkingTenant.serviceOptions.extra30Mins));
    })


    test("service options that extend the service's duration are reflected in availability", async () => {
        const availabilityWithoutOptions = getAvailabilityForService(everythingForAvailability, serviceAvailabilityRequest(individualDogWalk.id, saturday, saturday));
        expect(availabilityWithoutOptions).toBeDefined();
        expect(availabilityWithoutOptions.slots[saturday.value]).toBeDefined();
        expect(availabilityWithoutOptions.slots[saturday.value]).toHaveLength(17);

        const availabilityWithExtra60Mins = getAvailabilityForService(everythingForAvailability, serviceAvailabilityRequest(individualDogWalk.id, saturday, saturday, [], [serviceOptionRequest(extra60Mins.id)]));
        expect(availabilityWithExtra60Mins).toBeDefined();
        expect(availabilityWithExtra60Mins.slots[saturday.value]).toBeDefined();
        expect(availabilityWithExtra60Mins.slots[saturday.value]).toHaveLength(15);
    })

    test("price breakdown shows service price and option prices", () => {
        const availabilityWithTwoExtras = getAvailabilityForService(everythingForAvailability,
            serviceAvailabilityRequest(individualDogWalk.id, saturday, saturday, [], [
                serviceOptionRequest(extra30Mins.id),
                serviceOptionRequest(extra60Mins.id, 2)])) as AvailabilityResponse;
        const slotsToday = availabilityResponseFns.slotsForDate(availabilityWithTwoExtras, saturday);
        const firstSlot = mandatory(slotsToday[0], "No slots for " + saturday.value);
        expect(firstSlot.priceBreakdown.servicePrice).toBe(dogWalkingTenant.servicePrices.individualDogWalk + 200);
        expect(firstSlot.priceBreakdown.pricedOptions).toHaveLength(2);

        expect(firstSlot.priceBreakdown.pricedOptions[0].serviceOptionId).toBe(extra30Mins.id.value);
        expect(firstSlot.priceBreakdown.pricedOptions[0].unitPrice).toBe(dogWalkingTenant.serviceOptionPrices.extra30Mins);
        expect(firstSlot.priceBreakdown.pricedOptions[0].quantity).toBe(1);
        expect(firstSlot.priceBreakdown.pricedOptions[0].price).toBe(dogWalkingTenant.serviceOptionPrices.extra30Mins);

        expect(firstSlot.priceBreakdown.pricedOptions[1].serviceOptionId).toBe(extra60Mins.id.value);
        expect(firstSlot.priceBreakdown.pricedOptions[1].unitPrice).toBe(dogWalkingTenant.serviceOptionPrices.extra60Mins);
        expect(firstSlot.priceBreakdown.pricedOptions[1].quantity).toBe(2);
        expect(firstSlot.priceBreakdown.pricedOptions[1].price).toBe(dogWalkingTenant.serviceOptionPrices.extra60Mins * 2);
    });
});
