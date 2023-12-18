import {expect, test} from 'vitest'

import {
    availabilityCalendar,
    booking,
    businessAvailability,
    businessConfiguration,
    calculateAvailability,
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

const nineToOne = timeslotSpec(time24('09:00'), time24('13:00'), '09:00 - 13:00');
const oneToFour = timeslotSpec(time24('13:00'), time24('16:00'), '13:00 - 16:00');
const fourToSix = timeslotSpec(time24('16:00'), time24('18:00'), '16:00 - 18:00');
const timeslots = [nineToOne, oneToFour, fourToSix];

const nineToSix = timePeriod(time24('09:00'), time24('18:00'));

const availability = businessAvailability(availabilityCalendar([
    dayAndTimePeriod(isoDate("2021-05-23"), timePeriod(time24('16:00'), time24('18:00'))),
    dayAndTimePeriod(isoDate("2021-05-24"), nineToSix),
    dayAndTimePeriod(isoDate("2021-05-25"), nineToSix),
]), timezone('Europe/London'));


const van = resourceType('van');
const admin = resourceType('admin');
const van1 = resource(van, "Van 1");
const van2 = resource(van, "Van 2");
const ourAdmin = resource(admin, "Admin");
const resources = [van1, van2, ourAdmin];

const resourceAvailability = resources.map(r => resourceDayAvailability(r, [
    dayAndTimePeriod(isoDate("2021-05-23"), nineToSix),
    dayAndTimePeriod(isoDate("2021-05-24"), nineToSix),
    dayAndTimePeriod(isoDate("2021-05-25"), nineToSix),
    dayAndTimePeriod(isoDate("2021-05-26"), nineToSix),
]))

const smallCarWash = service('Small Car Wash', [van], 120, true, price(1000, GBP));
const mediumCarWash = service('Medium Car Wash', [van], 120, true, price(1500, GBP));
const largeCarWash = service('Large Car Wash', [van], 120, true, price(2000, GBP));
const thirtyMinuteZoomCall = service('Sales Call on Zoom', [admin], 30, false, price(0, GBP));
const services = [smallCarWash, mediumCarWash, largeCarWash, thirtyMinuteZoomCall];

const config = businessConfiguration(availability, resourceAvailability, services, timeslots, periodicStartTime(duration(30)));

const mike = customer('Mike', 'Hogan', 'mike@email.com', '555-555-555');
const mete = customer('Mete', 'Bora', 'mete@email.com', '666-666-666');

const mikeOnMonday = booking(mike.id, smallCarWash.id, isoDate('2021-05-24'), nineToOne);
const meteOnMonday = booking(mete.id, mediumCarWash.id, isoDate('2021-05-24'), nineToOne);
const mikeOnTuesday = booking(mike.id, mediumCarWash.id, isoDate('2021-05-25'), oneToFour);
const meteOnTuesday = booking(mete.id, largeCarWash.id, isoDate('2021-05-25'), fourToSix);

const existingBookings = [mikeOnMonday, meteOnMonday, mikeOnTuesday, meteOnTuesday];

test("can get availability for a given date range", () => {
    const smallCarWashAvailability = calculateAvailability(config, existingBookings, smallCarWash.id, isoDate('2021-05-23'), isoDate('2021-05-26'));
    expect(smallCarWashAvailability[0]?.bookableSlots).toHaveLength(1);
    expect(smallCarWashAvailability[1]?.bookableSlots).toHaveLength(2);
    expect(smallCarWashAvailability[2]?.bookableSlots).toHaveLength(3);
    expect(smallCarWashAvailability[3]?.bookableSlots).toHaveLength(0);
})