import {expect, test} from 'vitest'
import {
    anySuitableResource,
    dayAndTimePeriod,
    exactTimeAvailability,
    GBP,
    IsoDate,
    isoDate,
    minutes,
    price,
    resource,
    resourceType,
    service,
    time24,
    timePeriodFns
} from "../src/types.js";
import {
    amountBasedPriceAdjustment,
    calculatePrice,
    percentageBasedPriceAdjustment,
    timeBasedPriceAdjustment
} from "../src/calculatePrice.js";
import {availableSlot, AvailableSlot, resourceAllocation} from "../src/index.js";

test("base rate when there are no pricing adjustments", () => {
    const pricedSlot = calculatePrice(carWash(today), []);
    expect(pricedSlot.price).toEqual(smallCarWash.price);
    expect(pricedSlot.adjustments).toHaveLength(0);
})

test("adjustments for today and tomorrow, otherwise base rate", () => {
    const addSevenFifty = amountBasedPriceAdjustment(price(750, GBP));
    const addFiftyPercent = percentageBasedPriceAdjustment(0.5);
    const adjustmentForToday = timeBasedPriceAdjustment(dayAndTimePeriod(today, timePeriodFns.allDay), addSevenFifty);
    const adjustmentForTomorrow = timeBasedPriceAdjustment(dayAndTimePeriod(tomorrow, timePeriodFns.allDay), addFiftyPercent);
    const pricingRules = [adjustmentForToday, adjustmentForTomorrow];

    const pricedCarWashToday = calculatePrice(carWash(today), pricingRules);
    expect(pricedCarWashToday.price).toEqual(price(1750, GBP));
    expect(pricedCarWashToday.adjustments).toEqual([addSevenFifty]);

    const pricedCarWashTomorrow = calculatePrice(carWash(tomorrow), pricingRules);
    expect(pricedCarWashTomorrow.price).toEqual(price(1500, GBP));
    expect(pricedCarWashTomorrow.adjustments).toEqual([addFiftyPercent]);

    const pricedCarWashInTwoDaysTime = calculatePrice(carWash(isoDate('2021-05-26')), pricingRules);
    expect(pricedCarWashInTwoDaysTime.price).toEqual(price(1000, GBP));
    expect(pricedCarWashInTwoDaysTime.adjustments).toEqual([]);
})

const van = resourceType('van');
const van1 = resource(van, "Van 1");
const anySuitableVan = anySuitableResource(van);
const smallCarWash = service('Small Car Wash', 'Small Car Wash', [anySuitableVan], minutes(120), price(1000, GBP), [], []);
const today = isoDate('2021-05-24');
const tomorrow = isoDate('2021-05-25');

function carWash(today: IsoDate): AvailableSlot {
    return availableSlot(smallCarWash, today, exactTimeAvailability(time24('09:00')), [resourceAllocation(anySuitableVan, van1)])
}
