import {expect, test} from 'vitest'

import {
    availabilityBlock,
    bookableTimeSlot,
    booking,
    businessAvailability,
    businessConfiguration,
    customer,
    dayAndTimePeriod,
    duration,
    isoDate,
    minutes,
    periodicStartTime,
    resourceDayAvailability,
    ResourcedTimeSlot,
    resourcedTimeSlot,
    timePeriod,
    timezone
} from "../src/types.js";
import {calculateAvailability, carwash} from "../src/index.js";

const may23 = isoDate("2021-05-23");
const availability = businessAvailability([
    dayAndTimePeriod(may23, timePeriod(carwash.fourPm, carwash.sixPm)),
    dayAndTimePeriod(isoDate("2021-05-24"), carwash.nineToSix),
    dayAndTimePeriod(isoDate("2021-05-25"), carwash.nineToSix),
], timezone('Europe/London'));

const resourceAvailability = carwash.resources.map(r => resourceDayAvailability(r, [
    dayAndTimePeriod(may23, carwash.nineToSix),
    dayAndTimePeriod(isoDate("2021-05-24"), carwash.nineToSix),
    dayAndTimePeriod(isoDate("2021-05-25"), carwash.nineToSix),
    dayAndTimePeriod(isoDate("2021-05-26"), carwash.nineToSix),
].map(when => availabilityBlock(when))))

const config = businessConfiguration(availability, resourceAvailability, carwash.services, [], carwash.timeslots, [], periodicStartTime(duration(minutes(30))), null);

const mike = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671");
const mete = customer('Mete', 'Bora', 'mete@email.com', "+14155552672");

const mikeOnMonday = booking(mike.id, carwash.smallCarWash, isoDate('2021-05-24'), carwash.nineToOne.slot, []);
const meteOnMonday = booking(mete.id, carwash.mediumCarWash, isoDate('2021-05-24'), carwash.nineToOne.slot, []);
const mikeOnTuesday = booking(mike.id, carwash.mediumCarWash, isoDate('2021-05-25'), carwash.oneToFour.slot, []);
const meteOnTuesday = booking(mete.id, carwash.largeCarWash, isoDate('2021-05-25'), carwash.fourToSix.slot, []);

const existingBookings = [mikeOnMonday, meteOnMonday, mikeOnTuesday, meteOnTuesday];

test("can get availability for a given date range", () => {
    const smallCarWashAvailability = calculateAvailability(config, existingBookings, carwash.smallCarWash.id, isoDate('2021-05-23'), isoDate('2021-05-26')) as ResourcedTimeSlot[]
    expect(smallCarWashAvailability).toHaveLength(10)
    expect(smallCarWashAvailability[0]).toEqual(resourcedTimeSlot(bookableTimeSlot(may23, carwash.fourToSix), [carwash.van1], carwash.smallCarWash));
    expect(smallCarWashAvailability[1]).toEqual(resourcedTimeSlot(bookableTimeSlot(may23, carwash.fourToSix), [carwash.van2], carwash.smallCarWash));
    expect(smallCarWashAvailability[2]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-24'), carwash.oneToFour), [carwash.van1], carwash.smallCarWash));
    expect(smallCarWashAvailability[3]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-24'), carwash.oneToFour), [carwash.van2], carwash.smallCarWash));
    expect(smallCarWashAvailability[4]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-24'), carwash.fourToSix), [carwash.van1], carwash.smallCarWash));
    expect(smallCarWashAvailability[5]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-24'), carwash.fourToSix), [carwash.van2], carwash.smallCarWash));
    expect(smallCarWashAvailability[6]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-25'), carwash.nineToOne), [carwash.van1], carwash.smallCarWash));
    expect(smallCarWashAvailability[7]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-25'), carwash.nineToOne), [carwash.van2], carwash.smallCarWash));
    expect(smallCarWashAvailability[8]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-25'), carwash.oneToFour), [carwash.van2], carwash.smallCarWash));
    expect(smallCarWashAvailability[9]).toEqual(resourcedTimeSlot(bookableTimeSlot(isoDate('2021-05-25'), carwash.fourToSix), [carwash.van2], carwash.smallCarWash));
})

test("resource unavailability drops slots", () => {
    const resourceAvailability = carwash.resources.map(r => resourceDayAvailability(r, [
        dayAndTimePeriod(may23, carwash.nineToOne.slot),
        dayAndTimePeriod(isoDate("2021-05-24"), carwash.nineToSix),
        dayAndTimePeriod(isoDate("2021-05-25"), carwash.nineToSix),
        dayAndTimePeriod(isoDate("2021-05-26"), carwash.nineToSix),
    ].map(when => availabilityBlock(when))))
    const config = businessConfiguration(availability, resourceAvailability, carwash.services, [], carwash.timeslots, [], periodicStartTime(duration(30)), null);
    const smallCarWashAvailability = calculateAvailability(config, existingBookings, carwash.smallCarWash.id, isoDate('2021-05-23'), isoDate('2021-05-26'));
    expect(smallCarWashAvailability[0]?.date).toEqual(isoDate('2021-05-24')); // only open from 4pm to 6pm, but resources only available from 9am to 1pm

})