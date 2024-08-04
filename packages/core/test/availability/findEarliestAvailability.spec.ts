import {describe, expect, test} from 'vitest';
import {
    capacity,
    daysOfWeek,
    duration,
    isoDate,
    isoDateFns,
    minutes,
    resourceId,
    resourceType,
    serviceId,
    time24,
    timePeriod
} from '@breezbook/packages-types';
import {resourcing} from "@breezbook/packages-resourcing";
import {booking, customerId, periodicStartTime, price, service} from '../../src/types.js';
import {
    availabilityConfiguration,
    configuration,
    GBP,
    scheduleConfig,
    singleDaySchedulingFns
} from "../../src/index.js";
import {findEarliestAvailability} from "../../src/index.js";
import {makeBusinessAvailability, makeBusinessHours} from "../../src/makeBusinessAvailability.js";
import {jexlExpression, multiply, pricingFactorName, PricingRule} from "@breezbook/packages-pricing";
import resource = resourcing.resource;
import anySuitableResource = resourcing.anySuitableResource;
import resourceAvailability = configuration.resourceAvailability;
import makeAvailabilityBlocks = configuration.makeAvailabilityBlocks;

describe('findEarliestAvailability', () => {
    const roomType = resourceType('room');
    const room1 = resource(roomType, [], {}, resourceId('room1'));
    const room2 = resource(roomType, [], {}, resourceId('room2'));
    const nineAm = time24('09:00');
    const fivePm = time24('17:00');
    const startDate = isoDate('2023-07-01');
    const fullDay = timePeriod(nineAm, fivePm);
    const endDate = isoDate('2023-07-04');
    const dates = isoDateFns.listDays(startDate, endDate);

    const testService = service(
        [anySuitableResource(roomType)],
        price(1000, GBP),
        [],
        [],
        scheduleConfig(singleDaySchedulingFns.pickTime({
            startTime: nineAm,
            endTime: fivePm,
        })),
        capacity(1),
        serviceId('test-service')
    );
    const room1BookedAllDay = booking(customerId(), testService, startDate, fullDay)


    const testConfig = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(daysOfWeek, nineAm, fivePm), [], dates),
        [
            resourceAvailability(room1, makeAvailabilityBlocks(dates, fullDay)),
            resourceAvailability(room2, makeAvailabilityBlocks(dates, fullDay))
        ],
        [],
        periodicStartTime(duration(minutes(60)))
    );

    test('should return earliest availability for a single day and two resources', () => {
        const result = findEarliestAvailability(
            testConfig,
            testService,
            [],
            roomType,
            startDate,
            endDate,
            []
        );

        expect(result).toHaveLength(2);
        expect(result[0].resource).toEqual(room1);
        expect(result[0].earliestDate).toEqual(startDate);
        expect(result[0].earliestTime).toEqual(nineAm);
        expect(result[0].cheapestPrice).toEqual(price(1000, GBP));

        expect(result[1].resource).toEqual(room2);
        expect(result[1].earliestDate).toEqual(startDate);
        expect(result[1].earliestTime).toEqual(nineAm);
        expect(result[1].cheapestPrice).toEqual(price(1000, GBP));
    });

    test("being booked for the day affects availability", () => {
        const result = findEarliestAvailability(
            testConfig,
            testService,
            [room1BookedAllDay],
            roomType,
            startDate,
            endDate,
            []
        );
        expect(result).toHaveLength(2);
        expect(result[0].resource).toEqual(room1);
        expect(result[0].earliestDate).toEqual(isoDateFns.addDays(startDate, 1));
        expect(result[0].earliestTime).toEqual(nineAm);
        expect(result[0].cheapestPrice).toEqual(price(1000, GBP));
    });

    test("cheapest price is returned correctly", () => {
        const tomorrow = isoDateFns.addDays(startDate, 1).value;

        const halfPriceTomorrow: PricingRule = {
            id: 'half-price-tomorrow',
            name: 'Half price tomorrow',
            description: 'Half price tomorrow',
            requiredFactors: [pricingFactorName("bookingDate")],
            mutations: [{
                condition: jexlExpression(`bookingDate == "${tomorrow}"`),
                mutation: multiply(0.5),
                description: 'Half price'
            }],
            applyAllOrFirst: 'all'
        }

        const result = findEarliestAvailability(
            testConfig,
            testService,
            [],
            roomType,
            startDate,
            endDate,
            [halfPriceTomorrow]
        );

        expect(result).toHaveLength(2);
        expect(result[0].resource).toEqual(room1);
        expect(result[0].earliestDate).toEqual(startDate);
        expect(result[0].earliestTime).toEqual(nineAm);
        expect(result[0].cheapestPrice).toEqual(price(500, GBP));

        expect(result[1].resource).toEqual(room2);
        expect(result[1].earliestDate).toEqual(startDate);
        expect(result[1].earliestTime).toEqual(nineAm);
        expect(result[1].cheapestPrice).toEqual(price(500, GBP));
    })

    test('should return null for unavailable days', () => {
        const result = findEarliestAvailability(
            testConfig,
            testService,
            [],
            roomType,
            isoDate('2023-07-20'),
            isoDate('2023-07-20'),
            []
        );

        expect(result).toHaveLength(2);
        expect(result[0].resource).toEqual(room1);
        expect(result[0].earliestDate).toBeNull();
        expect(result[0].earliestTime).toBeNull();
        expect(result[0].cheapestPrice).toBeNull();

        expect(result[1].resource).toEqual(room2);
        expect(result[1].earliestDate).toBeNull();
        expect(result[1].earliestTime).toBeNull();
        expect(result[1].cheapestPrice).toBeNull();
    });

    test('should handle an empty date range', () => {
        const result = findEarliestAvailability(
            testConfig,
            testService,
            [],
            roomType,
            isoDate('2023-07-01'),
            isoDate('2023-06-30'),
            []
        );

        expect(result).toHaveLength(2);

        expect(result[0].resource).toEqual(room1);
        expect(result[0].earliestDate).toBeNull();

        expect(result[1].resource).toEqual(room2);
        expect(result[1].earliestDate).toBeNull();
    });
});