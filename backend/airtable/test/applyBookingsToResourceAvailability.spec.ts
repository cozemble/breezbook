import {expect, test} from 'vitest'
import {applyBookingsToResourceAvailability} from "../src/applyBookingsToResourceAvailability.js";
import {
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
    timePeriod,
    timeslotSpec
} from "../src/types.js";

const van = resourceType('van');
const van1 = resource(van, "Van 1");
const carWash = service('Car Wash', [van], 120, true, price(1000, GBP));
const services = [carWash];
const nineAm = time24('09:00')
const tenAm = time24('10:00')
const elevenAm = time24('11:00')
const sixPm = time24('18:00')

test("no bookings leaves all availability", () => {
    const resourceAvailability = [resourceDayAvailability(van1, [dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, sixPm))])];
    expect(applyBookingsToResourceAvailability(resourceAvailability, [], services)).toEqual(resourceAvailability);
})

test("booking of same length as resource availability", () => {
    const resourceAvailability = [resourceDayAvailability(van1, [dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, tenAm))])];
    const bookings = [booking(customerId("1"), carWash.id, isoDate("2021-05-23"), timeslotSpec(nineAm, tenAm, "09:00 - 10:00"))];
    expect(applyBookingsToResourceAvailability(resourceAvailability, bookings, services)).toEqual([resourceDayAvailability(van1, [])]);
})

test("booking that ends before resource availability ends", () => {
    const resourceAvailability = [resourceDayAvailability(van1, [dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, sixPm))])];
    const bookings = [booking(customerId("1"), carWash.id, isoDate("2021-05-23"), timeslotSpec(nineAm, tenAm, "09:00 - 10:00"))];
    expect(applyBookingsToResourceAvailability(resourceAvailability, bookings, services)).toEqual([resourceDayAvailability(van1, [dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(tenAm, sixPm))])]);
})

test("booking that starts after resource availability starts", () => {
    const resourceAvailability = [resourceDayAvailability(van1, [dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, sixPm))])];
    const bookings = [booking(customerId("1"), carWash.id, isoDate("2021-05-23"), timeslotSpec(tenAm, sixPm, "10:00 - 18:00"))];
    expect(applyBookingsToResourceAvailability(resourceAvailability, bookings, services)).toEqual([resourceDayAvailability(van1, [dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, tenAm))])]);
})

test("booking that starts and ends in the middle of a resource availability", () => {
    const resourceAvailability = [resourceDayAvailability(van1, [dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, sixPm))])];
    const bookings = [booking(customerId("1"), carWash.id, isoDate("2021-05-23"), timeslotSpec(tenAm, elevenAm, "10:00 - 11:00"))];
    expect(applyBookingsToResourceAvailability(resourceAvailability, bookings, services)).toEqual([resourceDayAvailability(van1, [dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(nineAm, tenAm)), dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(elevenAm, sixPm))])]);
})