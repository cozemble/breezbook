import {expect, test} from 'vitest'
import {
    availableSlot,
    AvailableSlot,
    calculatePrice,
    carwash,
    currencies,
    price,
    resourceAllocation,
    serviceRequest,
    timeslotSpec
} from "../src/index.js";
import {
    add,
    jexlExpression,
    multiply,
    parameterisedPricingFactor,
    perHour,
    pricingFactorName,
    PricingRule
} from "@breezbook/packages-pricing";
import {capacity, IsoDate, isoDate, isoDateFns, time24, time24Fns} from '@breezbook/packages-types';

const today = isoDate();
const tomorrow = isoDateFns.addDays(today, 1);
const twoDaysFromNow = isoDateFns.addDays(today, 2);
const GBP = currencies.GBP

test("base rate when there are no pricing rules", () => {
    const pricedSlot = calculatePrice( carWash(today), []);
    expect(pricedSlot.price).toEqual(carwash.smallCarWash.price);
    expect(pricedSlot.adjustments).toHaveLength(0);
})

test("can make price amendments based on days until the booking", () => {
    const addMoreIfBookingIsNear: PricingRule = {
        id: 'add-more-if-booking-is-near',
        name: 'Add More If Booking Is Near',
        description: 'Add more if booking is near',
        requiredFactors: [pricingFactorName('daysUntilBooking')],
        mutations: [
            {
                condition: jexlExpression('daysUntilBooking == 0'),
                mutation: add(750),
                description: 'Add £7.50 for booking today',
            },
            {
                condition: jexlExpression('daysUntilBooking == 1'),
                mutation: multiply(1.5),
                description: '50% increase applied for booking tomorrow',
            },
        ],
        applyAllOrFirst: 'first'
    }

    const pricingRules = [addMoreIfBookingIsNear];

    const pricedCarWashToday = calculatePrice(carWash(today), pricingRules);
    expect(pricedCarWashToday.price).toEqual(price(1750, GBP));
    expect(pricedCarWashToday.adjustments).toHaveLength(1);

    const pricedCarWashTomorrow = calculatePrice(carWash(tomorrow), pricingRules);
    expect(pricedCarWashTomorrow.price).toEqual(price(1500, GBP));
    expect(pricedCarWashTomorrow.adjustments).toHaveLength(1);

    const pricedCarWashInTwoDaysTime = calculatePrice(carWash(twoDaysFromNow), pricingRules);
    expect(pricedCarWashInTwoDaysTime.price).toEqual(price(1000, GBP));
    expect(pricedCarWashInTwoDaysTime.adjustments).toEqual([]);
})

test("can add £2 per hour if the booking is at a weekend", () => {
    const addMoreForWeekend: PricingRule = {
        id: 'add-more-for-weekend',
        name: 'Add More For Weekend',
        description: 'Add more for weekend',
        requiredFactors: [pricingFactorName('dayOfWeek')],
        context: {
            weekendDays: ['Saturday', 'Sunday']
        },
        mutations: [
            {
                condition: jexlExpression('weekendDays | includes(dayOfWeek)'),
                mutation: perHour(add(200)),
                description: 'Add £2 per-hour on weekends',
            },
        ],
        applyAllOrFirst: 'all'
    }

    const pricingRules = [addMoreForWeekend];
    const friday = isoDate('2024-07-12');
    const saturday = isoDate('2024-07-13');


    const fridayPrice = calculatePrice(carWash(friday), pricingRules);
    expect(fridayPrice.price).toEqual(price(1000, GBP));
    expect(fridayPrice.adjustments).toHaveLength(0);

    const saturdayPrice = calculatePrice(carWash(saturday), pricingRules);
    expect(saturdayPrice.price).toEqual(price(1400, GBP)); // service is 2 hours long
    expect(saturdayPrice.adjustments).toHaveLength(1);
});

test("can add £1 per hour for the evening hours of a booking", () => {
    const addMoreForEvening: PricingRule = {
        id: 'add-more-for-evening',
        name: 'Add More For Evening',
        description: 'Add more for evening hours between 18:00 and 24:00',
        requiredFactors: [parameterisedPricingFactor('hourCount', 'numberOfEveningHours', {
            startingTime: time24("18:00"),
            endingTime: time24("24:00")
        })],
        mutations: [
            {
                condition: jexlExpression('numberOfEveningHours > 0'),
                mutation: add(jexlExpression('numberOfEveningHours * 100')),
                description: 'Add £1 per-hour for evening bookings',
            },
        ],
        applyAllOrFirst: 'all'
    };

    const morningBooking = carWash(today, carwash.van1, time24('09:00'), time24('11:00'));
    const eveningBooking = carWash(today, carwash.van1, time24('17:00'), time24('19:00'));
    const nightBooking = carWash(today, carwash.van1, time24('22:00'), time24('23:00'));
    const halfHourNightBooking = carWash(today, carwash.van1, time24('22:00'), time24('22:30'));
    const fullEveningBooking = carWash(today, carwash.van1, time24('18:00'), time24('24:00'));

    const morningPrice = calculatePrice(morningBooking, [addMoreForEvening]);
    expect(morningPrice.price).toEqual(price(1000, GBP));
    expect(morningPrice.adjustments).toHaveLength(0);

    const eveningPrice = calculatePrice(eveningBooking, [addMoreForEvening]);
    expect(eveningPrice.price).toEqual(price(1100, GBP)); // 1000 base + 100 * 1 hour (18:00-19:00)
    expect(eveningPrice.adjustments).toHaveLength(1);

    const nightPrice = calculatePrice(nightBooking, [addMoreForEvening]);
    expect(nightPrice.price).toEqual(price(1100, GBP)); // 1000 base + 100 * 1 hour (23:00-24:00)
    expect(nightPrice.adjustments).toHaveLength(1);

    const halfHourNightPrice = calculatePrice(halfHourNightBooking, [addMoreForEvening]);
    expect(halfHourNightPrice.price).toEqual(price(1050, GBP)); // 1000 base + 100 * 0.5 hour
    expect(halfHourNightPrice.adjustments).toHaveLength(1);

    const fullEveningPrice = calculatePrice(fullEveningBooking, [addMoreForEvening]);
    expect(fullEveningPrice.price).toEqual(price(1600, GBP)); // 1000 base + 100 * 6 hours
    expect(fullEveningPrice.adjustments).toHaveLength(1);
})

test("can make price amendments on the usage of a particular resource", () => {
    // van2 is £20 more expensive than van1 because van2 is tier 1 and van1 is tier 2
    const payMoreForTier1Van: PricingRule = {
        id: 'pay-more-for-tier-1-van',
        name: 'Pay More For Tier 1 Van',
        description: 'Pay more for tier 1 van',
        requiredFactors: [pricingFactorName('resourceMetadata')],
        mutations: [
            {
                condition: jexlExpression("resourceMetadata | filter('metadata.tier', '== 1') | length > 0"),
                mutation: add(2000),
                description: 'Add £20 for tier 1 van',
            },
        ],
        applyAllOrFirst: 'all'
    }
    const pricedForVan1 = calculatePrice(carWash(today, carwash.van1), [payMoreForTier1Van]);
    expect(pricedForVan1.price).toEqual(carwash.smallCarWash.price);
    expect(pricedForVan1.adjustments).toHaveLength(0);

    const pricedForVan2 = calculatePrice(carWash(today, carwash.van2), [payMoreForTier1Van]);
    expect(pricedForVan2.price).toEqual(price(3000, GBP));
    expect(pricedForVan2.adjustments).toHaveLength(1);
});

function carWash(date: IsoDate, van = carwash.van1, startTime = time24('09:00'), endTime = time24('11:00')): AvailableSlot {
    const diff = time24Fns.duration(startTime, endTime);
    const timeslot = timeslotSpec(startTime, endTime, `${startTime.value} - ${endTime.value}`)
    const mutatedService = {...carwash.smallCarWash, duration: diff.value, startTimes: [timeslot]};
    const theServiceRequest = serviceRequest(mutatedService, date);
    return availableSlot(
        theServiceRequest,
        timeslot,
        [resourceAllocation(carwash.resourceRequirements.anySuitableVan, van)],
        capacity(1),
        capacity(0)
    );
}