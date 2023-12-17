import {expect, test} from 'vitest'

import {
    availabilityCalendar,
    booking,
    businessAvailability,
    businessConfiguration,
    calculateAvailability,
    customer,
    dayAvailability,
    discreteStartTimes,
    exactTimeAvailability,
    GBP,
    price,
    resource,
    resourceType,
    service,
    time24,
    timeRangeAvailability,
    timezone
} from "../src/types.js";

const nineAm = time24('09:00');
const nineTen = time24('09:10');
const nineTwenty = time24('09:20');
const nineThirty = time24('09:30');

const morningCheckInTimes = [nineAm, nineTen, nineTwenty, nineThirty];
const nineToTen = timeRangeAvailability(nineAm, time24('10:00'));

const availability = businessAvailability(availabilityCalendar([
    dayAvailability('2021-05-24', [nineToTen]),
    dayAvailability('2021-05-25', [nineToTen]),
]), timezone('Europe/London'));

const staff = resourceType('staff');
const amy = resource(staff, "Amy");

const bicycleRepair = service('Bicycle Repair', [staff], 5, false, price(3500, GBP));
const services = [bicycleRepair];

const config = businessConfiguration(availability, [amy], services, [], discreteStartTimes(morningCheckInTimes));

const mike = customer('Mike', 'Hogan', 'mike@email.com', '555-555-555');
const mete = customer('Mete', 'Bora', 'mete@email.com', '666-666-666');

const mikeOnMonday = booking(mike.id, bicycleRepair.id, '2021-05-24', exactTimeAvailability(nineAm));
const meteOnMonday = booking(mete.id, bicycleRepair.id, '2021-05-24', exactTimeAvailability(nineTen));
const mikeOnTuesday = booking(mike.id, bicycleRepair.id, '2021-05-25', exactTimeAvailability(nineTwenty));
const meteOnTuesday = booking(mete.id, bicycleRepair.id, '2021-05-25', exactTimeAvailability(nineAm));

const existingBookings = [mikeOnMonday, meteOnMonday, mikeOnTuesday, meteOnTuesday];

test("can get availability for a given date range", () => {
    const bikeRepairAvailability = calculateAvailability(config, existingBookings, bicycleRepair.id, '2021-05-23', '2021-05-26');
    expect(bikeRepairAvailability).toHaveLength(4);
    expect(bikeRepairAvailability[0]?.bookableTimes).toHaveLength(4);
    expect(bikeRepairAvailability[1]?.bookableTimes).toHaveLength(2);
    expect(bikeRepairAvailability[2]?.bookableTimes).toHaveLength(2);
    expect(bikeRepairAvailability[3]?.bookableTimes).toHaveLength(4);
})