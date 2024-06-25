import {expect, test} from 'vitest'
import {
    anySuitableResource,
    capacity,
    exactTimeAvailability,
    GBP,
    IsoDate,
    isoDate,
    isoDateFns,
    minutes,
    price,
    resource,
    resourceType,
    service,
    time24
} from "../src/types.js";
import {availableSlot, AvailableSlot, calculatePrice, resourceAllocation,} from "../src/index.js";
import {add, jexlCondition, multiply, PricingRule} from "@breezbook/packages-pricing";

test("base rate when there are no pricing adjustments", () => {
    const pricedSlot = calculatePrice(carWash(today), []);
    expect(pricedSlot.price).toEqual(smallCarWash.price);
    expect(pricedSlot.adjustments).toHaveLength(0);
})

test("adjustments for today and tomorrow, otherwise base rate", () => {
    const addMoreIfBookingIsNear: PricingRule = {
        id: 'add-more-if-booking-is-near',
        name: 'Add More If Booking Is Near',
        description: 'Add more if booking is near',
        requiredFactors: ['daysUntilBooking'],
        mutations: [
            {
                condition: jexlCondition('daysUntilBooking == 0'),
                mutation: add(750),
                description: 'Add £7.50 for booking today',
            },
            {
                condition: jexlCondition('daysUntilBooking == 1'),
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

const van = resourceType('van');
const van1 = resource(van, "Van 1");
const anySuitableVan = anySuitableResource(van);
const smallCarWash = service('Small Car Wash', 'Small Car Wash', [anySuitableVan], minutes(120), price(1000, GBP), [], []);
const today = isoDate();
const tomorrow = isoDateFns.addDays(today, 1);
const twoDaysFromNow = isoDateFns.addDays(today, 2);

function carWash(today: IsoDate): AvailableSlot {
    return availableSlot(smallCarWash, today, exactTimeAvailability(time24('09:00')), [resourceAllocation(anySuitableVan, van1)], capacity(1), capacity(0))
}
