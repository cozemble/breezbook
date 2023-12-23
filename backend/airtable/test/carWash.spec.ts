import {expect, test} from 'vitest'

import {
    bookableTimeSlot,
    booking,
    businessAvailability,
    businessConfiguration,
    customer,
    dayAndTimePeriod,
    duration,
    isoDate,
    periodicStartTime,
    resourceDayAvailability,
    ResourcedTimeSlot,
    resourcedTimeSlot,
    timePeriod,
    timezone
} from "../src/types.js";
import {calculateAvailability} from "../src/calculateAvailability.js";
import {
    fourPm,
    fourToSix,
    largeCarWash,
    mediumCarWash,
    nineToOne,
    nineToSix,
    oneToFour,
    resources,
    services,
    sixPm,
    smallCarWash,
    timeslots,
    van1,
    van2
} from "./fixtures/carwash.js";

const may23 = isoDate("2021-05-23");
const availability = businessAvailability([
    dayAndTimePeriod(may23, timePeriod(fourPm, sixPm)),
    dayAndTimePeriod(isoDate("2021-05-24"), nineToSix),
    dayAndTimePeriod(isoDate("2021-05-25"), nineToSix),
], timezone('Europe/London'));


const resourceAvailability = resources.map(r => resourceDayAvailability(r, [
    dayAndTimePeriod(may23, nineToSix),
    dayAndTimePeriod(isoDate("2021-05-24"), nineToSix),
    dayAndTimePeriod(isoDate("2021-05-25"), nineToSix),
    dayAndTimePeriod(isoDate("2021-05-26"), nineToSix),
]))

const config = businessConfiguration(availability, resourceAvailability, services, [], timeslots, [], periodicStartTime(duration(30)));

const mike = customer('Mike', 'Hogan', 'mike@email.com');
const mete = customer('Mete', 'Bora', 'mete@email.com');

const mikeOnMonday = booking(mike.id, smallCarWash.id, isoDate('2021-05-24'), nineToOne);
const meteOnMonday = booking(mete.id, mediumCarWash.id, isoDate('2021-05-24'), nineToOne);
const mikeOnTuesday = booking(mike.id, mediumCarWash.id, isoDate('2021-05-25'), oneToFour);
const meteOnTuesday = booking(mete.id, largeCarWash.id, isoDate('2021-05-25'), fourToSix);

const existingBookings = [mikeOnMonday, meteOnMonday, mikeOnTuesday, meteOnTuesday];

test("can get availability for a given date range", () => {
    const smallCarWashAvailability = calculateAvailability(config, existingBookings, smallCarWash.id, isoDate('2021-05-23'), isoDate('2021-05-26')) as ResourcedTimeSlot[]
    expect(smallCarWashAvailability).toHaveLength(10)
    expect(smallCarWashAvailability[0]).toEqual(resourcedTimeSlot(bookableTimeSlot(may23, fourToSix), [van1], smallCarWash));
    expect(smallCarWashAvailability[1]).toEqual(resourcedTimeSlot(bookableTimeSlot(may23, fourToSix), [van2], smallCarWash));
    expect(smallCarWashAvailability[2]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-24'), oneToFour), [van1], smallCarWash));
    expect(smallCarWashAvailability[3]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-24'), oneToFour), [van2], smallCarWash));
    expect(smallCarWashAvailability[4]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-24'), fourToSix), [van1], smallCarWash));
    expect(smallCarWashAvailability[5]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-24'), fourToSix), [van2], smallCarWash));
    expect(smallCarWashAvailability[6]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-25'), nineToOne), [van1], smallCarWash));
    expect(smallCarWashAvailability[7]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-25'), nineToOne), [van2], smallCarWash));
    expect(smallCarWashAvailability[8]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-25'), oneToFour), [van2], smallCarWash));
    expect(smallCarWashAvailability[9]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-25'), fourToSix), [van2], smallCarWash));
})

test("resource unavailability drops slots", () => {
    const resourceAvailability = resources.map(r => resourceDayAvailability(r, [
        dayAndTimePeriod(may23, nineToOne.slot),
        dayAndTimePeriod(isoDate("2021-05-24"), nineToSix),
        dayAndTimePeriod(isoDate("2021-05-25"), nineToSix),
        dayAndTimePeriod(isoDate("2021-05-26"), nineToSix),
    ]))
    const config = businessConfiguration(availability, resourceAvailability, services, [], timeslots, [], periodicStartTime(duration(30)));
    const smallCarWashAvailability = calculateAvailability(config, existingBookings, smallCarWash.id, isoDate('2021-05-23'), isoDate('2021-05-26'));
    expect(smallCarWashAvailability[0]?.date).toEqual(isoDate('2021-05-24')); // only open from 4pm to 6pm, but resources only available from 9am to 1pm

})