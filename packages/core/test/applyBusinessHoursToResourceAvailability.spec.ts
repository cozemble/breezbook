import {expect, test} from "vitest";
import {fitAvailability} from "../src/applyBookingsToResourceAvailability.js";
import {dayAndTimePeriod, isoDate, resourceType, time24, timePeriod} from "@breezbook/packages-types";
import {configuration} from "../src/index.js";
import resourceDayAvailability = configuration.resourceAvailability;
import availabilityBlock = configuration.availabilityBlock;
import {resourcing} from "@breezbook/packages-resourcing";
import resource = resourcing.resource;

const van = resourceType('van');
const van1 = resource(van, []);
const eightAm = time24('08:00')
const nineAm = time24('09:00')
const nineThirty = time24('09:30')
const tenAm = time24('10:00')
const may23 = isoDate("2021-05-23");
const initialAvailability = [resourceDayAvailability(van1, [availabilityBlock(dayAndTimePeriod(may23, timePeriod(nineAm, tenAm)))])];

test("no business hours removes all resource availability", () => {
    const adjustedAvailability = fitAvailability(initialAvailability, []);
    expect(adjustedAvailability).toHaveLength(1);
    expect(adjustedAvailability?.[0]?.availability).toHaveLength(0);
})

test("business hours that span resource availability", () => {
    const businessHours = [dayAndTimePeriod(may23, timePeriod(eightAm, tenAm))];
    const adjustedAvailability = fitAvailability(initialAvailability, businessHours);
    expect(adjustedAvailability).toHaveLength(1);
    expect(adjustedAvailability).toEqual(initialAvailability);

})

test("business hours that start after resource availability", () => {
    const businessHours = [dayAndTimePeriod(may23, timePeriod(nineThirty, tenAm))];
    const adjustedAvailability = fitAvailability(initialAvailability, businessHours);
    expect(adjustedAvailability).toHaveLength(1);
    expect(adjustedAvailability?.[0]?.availability[0]?.when).toEqual(dayAndTimePeriod(may23, timePeriod(nineThirty, tenAm)));
})

test("business hours that start before resource availability", () => {
    const businessHours = [dayAndTimePeriod(may23, timePeriod(eightAm, nineThirty))];
    const adjustedAvailability = fitAvailability(initialAvailability, businessHours);
    expect(adjustedAvailability).toHaveLength(1);
    expect(adjustedAvailability?.[0]?.availability[0]?.when).toEqual(dayAndTimePeriod(may23, timePeriod(nineAm, nineThirty)));
})