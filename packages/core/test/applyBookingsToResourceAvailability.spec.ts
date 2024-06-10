import {expect, test} from 'vitest'
import {applyBookingsToResourceAvailability} from "../src/applyBookingsToResourceAvailability.js";
import {
    anySuitableResource,
    availabilityBlock,
    booking,
    customerId,
    dayAndTimePeriod,
    GBP,
    isoDate,
    price,
    resource,
    resourceDayAvailability,
    resourceType,
    service,
    time24,
    timePeriod
} from "../src/types.js";

const van = resourceType('van');
const van1 = resource(van, "Van 1");
const carWash = service('Car Wash', 'Car wash', [anySuitableResource(van)], 120, price(1000, GBP), [], []);
const nineAm = time24('09:00')
const tenAm = time24('10:00')
const elevenAm = time24('11:00')
const sixPm = time24('18:00')

test("no bookings leaves all availability", () => {
    const resourceAvailability = [resourceDayAvailability(van1, [availabilityBlock(dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, sixPm)))])];
    expect(applyBookingsToResourceAvailability(resourceAvailability, [])).toEqual(resourceAvailability);
})

test("booking of same length as resource availability", () => {
    const resourceAvailability = [resourceDayAvailability(van1, [availabilityBlock(dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, tenAm)))])];
    const bookings = [booking(customerId("1"), carWash, isoDate("2021-05-23"), timePeriod(nineAm, tenAm))];
    expect(applyBookingsToResourceAvailability(resourceAvailability, bookings)).toEqual([resourceDayAvailability(van1, [])]);
})

test("booking that ends before resource availability ends", () => {
    const resourceAvailability = [resourceDayAvailability(van1, [availabilityBlock(dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, sixPm)))])];
    const bookings = [booking(customerId("1"), carWash, isoDate("2021-05-23"), timePeriod(nineAm, tenAm))];
    expect(applyBookingsToResourceAvailability(resourceAvailability, bookings)).toEqual([resourceDayAvailability(van1, [availabilityBlock(dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(tenAm, sixPm)))])]);
})

test("booking that starts after resource availability starts", () => {
    const resourceAvailability = [resourceDayAvailability(van1, [availabilityBlock(dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, sixPm)))])];
    const bookings = [booking(customerId("1"), carWash, isoDate("2021-05-23"), timePeriod(tenAm, sixPm))];
    expect(applyBookingsToResourceAvailability(resourceAvailability, bookings)).toEqual([resourceDayAvailability(van1, [availabilityBlock(dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, tenAm)))])]);
})

test("booking that starts and ends in the middle of a resource availability", () => {
    const resourceAvailability = [resourceDayAvailability(van1, [availabilityBlock(dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, sixPm)))])];
    const bookings = [booking(customerId("1"), carWash, isoDate("2021-05-23"), timePeriod(tenAm, elevenAm))];
    expect(applyBookingsToResourceAvailability(resourceAvailability, bookings)).toEqual([resourceDayAvailability(van1, [availabilityBlock(dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, tenAm))), availabilityBlock(dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(elevenAm, sixPm)))])]);
})