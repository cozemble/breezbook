import {expect, test} from 'vitest'

import {
    booking,
    businessAvailability,
    businessConfiguration,
    customer,
    dayAndTimePeriod,
    discreteStartTimes,
    exactTimeAvailability,
    GBP,
    isoDate,
    price,
    fungibleResource,
    resourceDayAvailability,
    resourceType,
    service,
    time24,
    timePeriod,
    timezone
} from "../src/types.js";
import {calculateAvailability} from '../src/index.js';

const nineAm = time24('09:00');
const nineTen = time24('09:10');
const nineTwenty = time24('09:20');
const nineThirty = time24('09:30');

const morningCheckInTimes = [nineAm, nineTen, nineTwenty, nineThirty];
const nineToTen = timePeriod(nineAm, time24('10:00'));

const availability = businessAvailability([
    dayAndTimePeriod(isoDate('2021-05-24'), nineToTen),
    dayAndTimePeriod(isoDate('2021-05-25'), nineToTen),
], timezone('Europe/London'));

const staff = resourceType('staff');
const amy = fungibleResource(staff, "Amy");
const resources = [amy];

const resourceAvailability = resources.map(r => resourceDayAvailability(r, [
    dayAndTimePeriod(isoDate("2021-05-23"), nineToTen),
    dayAndTimePeriod(isoDate("2021-05-24"), nineToTen),
    dayAndTimePeriod(isoDate("2021-05-25"), nineToTen),
    dayAndTimePeriod(isoDate("2021-05-26"), nineToTen),
]))

const bicycleRepair = service('Bicycle Repair','Bicycle Repair', [staff], 5, false, price(3500, GBP), [], []);
const services = [bicycleRepair];

const config = businessConfiguration(availability, resourceAvailability, services, [],[], [],discreteStartTimes(morningCheckInTimes), null);

const mike = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671");
const mete = customer('Mete', 'Bora', 'mete@email.com', "+14155552672");

const mikeOnMonday = booking(mike.id, bicycleRepair.id, isoDate('2021-05-24'), exactTimeAvailability(nineAm), []);
const meteOnMonday = booking(mete.id, bicycleRepair.id, isoDate('2021-05-24'), exactTimeAvailability(nineTen), []);
const mikeOnTuesday = booking(mike.id, bicycleRepair.id, isoDate('2021-05-25'), exactTimeAvailability(nineTwenty), []);
const meteOnTuesday = booking(mete.id, bicycleRepair.id, isoDate('2021-05-25'), exactTimeAvailability(nineAm), []);

const existingBookings = [mikeOnMonday, meteOnMonday, mikeOnTuesday, meteOnTuesday];

test("can get availability for a given date range", () => {
    const bikeRepairAvailability = calculateAvailability(config, existingBookings, bicycleRepair.id, isoDate('2021-05-23'), isoDate('2021-05-26'));
    expect(bikeRepairAvailability).toHaveLength(4);
    expect(bikeRepairAvailability[0]?.bookableTimes).toHaveLength(4);
    expect(bikeRepairAvailability[1]?.bookableTimes).toHaveLength(2);
    expect(bikeRepairAvailability[2]?.bookableTimes).toHaveLength(2);
    expect(bikeRepairAvailability[3]?.bookableTimes).toHaveLength(4);
})