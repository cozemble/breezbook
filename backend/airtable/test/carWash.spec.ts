import {expect, test} from 'vitest'

import {
    bookableTimeSlot, ResourcedTimeSlot,
    resourcedTimeSlot,
    booking,
    businessAvailability,
    businessConfiguration,
    customer,
    dayAndTimePeriod,
    duration,
    GBP,
    isoDate,
    periodicStartTime,
    price,
    resource,
    resourceDayAvailability,
    resourceType,
    service,
    time24,
    timePeriod,
    timeslotSpec,
    timezone
} from "../src/types.js";
import {calculateAvailability} from "../src/calculateAvailability.js";

const nineAm = time24('09:00');
const onePm = time24('13:00');
const fourPm = time24('16:00');
const sixPm = time24('18:00');

const nineToOne = timeslotSpec(nineAm, onePm, '09:00 - 13:00');
const oneToFour = timeslotSpec(onePm, fourPm, '13:00 - 16:00');
const fourToSix = timeslotSpec(fourPm, sixPm, '16:00 - 18:00');
const timeslots = [nineToOne, oneToFour, fourToSix];

const nineToSix = timePeriod(nineAm, sixPm);

const may23 = isoDate("2021-05-23");
const availability = businessAvailability([
    dayAndTimePeriod(may23, timePeriod(fourPm, sixPm)),
    dayAndTimePeriod(isoDate("2021-05-24"), nineToSix),
    dayAndTimePeriod(isoDate("2021-05-25"), nineToSix),
], timezone('Europe/London'));


const van = resourceType('van');
const admin = resourceType('admin');
const van1 = resource(van, "Van 1");
const van2 = resource(van, "Van 2");
const ourAdmin = resource(admin, "Admin");
const resources = [van1, van2, ourAdmin];
const smallCarWash = service('Small Car Wash', [van], 120, true, price(1000, GBP), []);
const mediumCarWash = service('Medium Car Wash', [van], 120, true, price(1500, GBP), []);
const largeCarWash = service('Large Car Wash', [van], 120, true, price(2000, GBP), []);
const thirtyMinuteZoomCall = service('Sales Call on Zoom', [admin], 30, false, price(0, GBP), []);
const services = [smallCarWash, mediumCarWash, largeCarWash, thirtyMinuteZoomCall];

const resourceAvailability = resources.map(r => resourceDayAvailability(r, [
    dayAndTimePeriod(may23, nineToSix),
    dayAndTimePeriod(isoDate("2021-05-24"), nineToSix),
    dayAndTimePeriod(isoDate("2021-05-25"), nineToSix),
    dayAndTimePeriod(isoDate("2021-05-26"), nineToSix),
]))

const config = businessConfiguration(availability, resourceAvailability, services, [],timeslots, [],periodicStartTime(duration(30)));

const mike = customer('Mike', 'Hogan', 'mike@email.com', '555-555-555');
const mete = customer('Mete', 'Bora', 'mete@email.com', '666-666-666');

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
    const config = businessConfiguration(availability, resourceAvailability, services, [],timeslots, [],periodicStartTime(duration(30)));
    const smallCarWashAvailability = calculateAvailability(config, existingBookings, smallCarWash.id, isoDate('2021-05-23'), isoDate('2021-05-26'));
    expect(smallCarWashAvailability[0]?.date).toEqual(isoDate('2021-05-24')); // only open from 4pm to 6pm, but resources only available from 9am to 1pm

})