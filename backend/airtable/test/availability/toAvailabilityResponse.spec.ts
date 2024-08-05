import {expect, test} from 'vitest'
import {toAvailabilityResponse} from "../../src/availability/toAvailabilityResponse.js";
import {capacity, exactTimeAvailability, mandatory} from "@breezbook/packages-types";
import {
    availableSlot,
    carwash,
    priceBreakdown,
    pricedSlot,
    serviceRequest,
    timeslotSpec
} from "@breezbook/packages-core";
import {availabilityResponseFns} from "@breezbook/backend-api-types";
import { isoDateFns, time24, timezones } from '@breezbook/packages-date-time';

const date = isoDateFns.today(timezones.utc);
const thePriceBreakdown = priceBreakdown(carwash.smallCarWash.price, [], []);
const theServiceRequest = serviceRequest(carwash.smallCarWash, date);
test("converts a timeslot to an availability response", () => {
    const response = toAvailabilityResponse([
        pricedSlot(
            availableSlot(
                theServiceRequest,
                timeslotSpec(time24("09:00"), time24("10:00"), "Morning slot"),
                [],
                capacity(1),
                capacity(0)),
            thePriceBreakdown
        )
    ], carwash.smallCarWash.id, timezones.utc);
    const slots = availabilityResponseFns.slotsForDate(response, date)
    const firstSlot = mandatory(slots[0], `Expected a slot for date ${date.value}`);
    expect(firstSlot.startTime24hr).toBe("09:00");
    expect(firstSlot.endTime24hr).toBe("10:00");
    expect(firstSlot.label).toBe("Morning slot");
});

test("converts an exact time slot to an availability response", () => {
    const response = toAvailabilityResponse([
        pricedSlot(
            availableSlot(
                theServiceRequest,
                exactTimeAvailability(time24("09:00")),
                [],
                capacity(1),
                capacity(0)),
            thePriceBreakdown
        )
    ], carwash.smallCarWash.id, timezones.utc);
    const slots = availabilityResponseFns.slotsForDate(response, date)
    const firstSlot = mandatory(slots[0], `Expected a slot for date ${date.value}`);
    expect(firstSlot.startTime24hr).toBe("09:00");
    expect(firstSlot.endTime24hr).toBe("---");
    expect(firstSlot.label).toBe("09:00");

});