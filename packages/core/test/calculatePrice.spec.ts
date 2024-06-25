import {expect, test} from 'vitest'
import {capacity, exactTimeAvailability, GBP, isoDate, IsoDate, isoDateFns, price, time24} from "../src/types.js";
import {availableSlot, AvailableSlot, calculatePrice, carwash, resourceAllocation,} from "../src/index.js";
import {add, jexlCondition, multiply, PricingRule} from "@breezbook/packages-pricing";

const today = isoDate();
const tomorrow = isoDateFns.addDays(today, 1);
const twoDaysFromNow = isoDateFns.addDays(today, 2);

test("base rate when there are no pricing adjustments", () => {
    const pricedSlot = calculatePrice(carWash(today), []);
    expect(pricedSlot.price).toEqual(carwash.smallCarWash.price);
    expect(pricedSlot.adjustments).toHaveLength(0);
})

test("can make price amendments based on days until the booking", () => {
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

test("can make price amendments on the usage of a particular resource", () => {
    // van2 is £20 more expensive than van1 because van2 is tier 1 and van1 is tier 2
    const payMoreForTier1Van: PricingRule = {
        id: 'pay-more-for-tier-1-van',
        name: 'Pay More For Tier 1 Van',
        description: 'Pay more for tier 1 van',
        requiredFactors: ['resourceMetadata'],
        mutations: [
            {
                condition: jexlCondition("resourceMetadata | filter('metadata.tier', 1) | length > 0"),
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

function carWash(today: IsoDate, van = carwash.van1): AvailableSlot {
    return availableSlot(carwash.smallCarWash, today, exactTimeAvailability(time24('09:00')), [resourceAllocation(carwash.resourceRequirements.anySuitableVan, van)], capacity(1), capacity(0))
}
