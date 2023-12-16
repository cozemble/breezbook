import {test} from 'vitest'

import {
    booking,
    businessAvailability, businessConfiguration, calculateAvailability, customer, GBP, price, resource,
    resourceType, service,
    time24,
    timeRangeAvailability,
    timeslotSpec,
    timezone
} from "../src/types.js";

const nineToOne = timeslotSpec(time24('09:00'), time24('13:00'), '09:00 - 13:00');
const oneToFour = timeslotSpec(time24('13:00'), time24('16:00'), '13:00 - 16:00');
const fourToFix = timeslotSpec(time24('16:00'), time24('18:00'), '16:00 - 18:00');
const timeslots = [nineToOne, oneToFour, fourToFix];

const availability = businessAvailability([
    timeRangeAvailability(time24('09:00'), time24('18:00'))
], timezone('Europe/London'));


const van = resourceType('van');
const admin = resourceType('admin');
const van1 = resource(van, "Van 1");
const van2 = resource(van, "Van 2");
const ourAdmin = resource(admin, "Admin");
const resources = [van1, van2, ourAdmin];

const smallCarWash = service('Small Car Wash', [van], 120, true, price(1000, GBP));
const mediumCarWash = service('Medium Car Wash', [van], 120, true, price(1500, GBP));
const largeCarWash = service('Large Car Wash', [van], 120, true, price(2000, GBP));
const thirtyMinuteZoomCall = service('Sales Call on Zoom', [admin], 30, false, price(0, GBP));
const services = [smallCarWash, mediumCarWash, largeCarWash, thirtyMinuteZoomCall];

const config = businessConfiguration(availability, resources, services, timeslots);

const mike = customer('Mike', 'Hogan', 'mike@email.com', '555-555-555');
const mete = customer('Mete', 'Bora', 'mete@email.com', '666-666-666');

const mikeOnMonday = booking(mike.id, smallCarWash.id, '2021-05-24', nineToOne);
const meteOnMonday = booking(mete.id, mediumCarWash.id, '2021-05-24', nineToOne);
const mikeOnTuesday = booking(mike.id, mediumCarWash.id, '2021-05-25', oneToFour);
const meteOnTuesday = booking(mete.id, largeCarWash.id, '2021-05-25', fourToFix);

const existingBookings = [mikeOnMonday, meteOnMonday, mikeOnTuesday, meteOnTuesday];


test("can get availability for a given date range", () => {
    const smallCarWashAvailability = calculateAvailability(config, existingBookings, smallCarWash.id, '2021-05-13', '2021-05-27');
    console.log(JSON.stringify(smallCarWashAvailability, null, 2));
})