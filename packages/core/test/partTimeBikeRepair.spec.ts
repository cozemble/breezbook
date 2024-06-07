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
    resource,
    resourceDayAvailability,
    resourceType,
    service,
    time24,
    timePeriod,
    timezone, availabilityBlock, anySuitableResource, time24Fns
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
const amy = resource(staff, "Amy");
const resources = [amy];

const resourceAvailability = resources.map(r => resourceDayAvailability(r, [
    dayAndTimePeriod(isoDate("2021-05-23"), nineToTen),
    dayAndTimePeriod(isoDate("2021-05-24"), nineToTen),
    dayAndTimePeriod(isoDate("2021-05-25"), nineToTen),
    dayAndTimePeriod(isoDate("2021-05-26"), nineToTen),
].map(when => availabilityBlock(when))))

const bicycleRepair = service('Bicycle Repair','Bicycle Repair', [anySuitableResource(staff)], 5, price(3500, GBP), [], []);
const services = [bicycleRepair];

const config = businessConfiguration(availability, resourceAvailability, services, [],[], [],discreteStartTimes(morningCheckInTimes), null);

const mike = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671");
const mete = customer('Mete', 'Bora', 'mete@email.com', "+14155552672");

const mikeOnMonday = booking(mike.id, bicycleRepair, isoDate('2021-05-24'), timePeriod(nineAm, time24Fns.addMinutes(nineAm,5)), []);
const meteOnMonday = booking(mete.id, bicycleRepair, isoDate('2021-05-24'), timePeriod(nineTen, time24Fns.addMinutes(nineTen,5)), []);
const mikeOnTuesday = booking(mike.id, bicycleRepair, isoDate('2021-05-25'), timePeriod(nineTwenty, time24Fns.addMinutes(nineTwenty,5)), []);
const meteOnTuesday = booking(mete.id, bicycleRepair, isoDate('2021-05-25'), timePeriod(nineAm, time24Fns.addMinutes(nineAm,5)), []);

const existingBookings = [mikeOnMonday, meteOnMonday, mikeOnTuesday, meteOnTuesday];

test("can get availability for a given date range", () => {
    const bikeRepairAvailability = calculateAvailability(config, existingBookings, bicycleRepair.id, isoDate('2021-05-23'), isoDate('2021-05-26'));
    expect(bikeRepairAvailability).toHaveLength(4);
    expect(bikeRepairAvailability[0]?.bookableTimes).toHaveLength(4);
    expect(bikeRepairAvailability[1]?.bookableTimes).toHaveLength(2);
    expect(bikeRepairAvailability[2]?.bookableTimes).toHaveLength(2);
    expect(bikeRepairAvailability[3]?.bookableTimes).toHaveLength(4);
})