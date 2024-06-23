/**
 * What kind of pricing rules might a business want.  I am not talking about coupons or discounts here, but rather
 * the basic pricing rules that apply to a service.
 *
 * 1. A fixed price for a service
 * 2. Soon-ness pricing: the closer to the booking date, the more expensive the service.  Tomorrow is more expensive than the day after tomorrow
 * 3. Time of day pricing: 9am is more expensive than 3pm
 * 4. Day of week pricing: Saturday is more expensive than Tuesday
 * 5. Time of year pricing: Christmas is more expensive than January
 * 6. Resource type pricing: a van is more expensive than a car - never thought of this option, that a service might have resource type choices.  Add-ons will not do, because resource
 * consumption is key to scheduling
 * 7. Surge pricing - when demand is high, prices go up
 * 8. More specifics on resource based pricing - one instructor might be more expensive than another
 *
 * This can be reduced to:
 * 1. Base Rate: Establish a standard base rate for each service, which serves as the starting point for any price adjustments.
 *
 * 2. Time-Sensitive Pricing: Adjust prices based on the booking's proximity to the service date. For example, prices increase as the service date nears.
 *
 * 3. Demand-Based Pricing: Modify prices in response to varying levels of demand. This includes:
 *
 *      3.1 Time of Day Variations: Higher prices during peak hours, lower during off-peak hours.
 *      3.2 Day of Week Variations: Different prices for weekends versus weekdays.
 *      3.3 Seasonal Variations: Adjusted prices for high-demand seasons or specific times of the year.
 *      3.4 Surge Pricing: Increased prices during times of exceptionally high demand.
 *      3.5 Special Event Pricing: Higher prices for special events, like holidays or concerts.
 *
 * 4. Resource-Dependent Pricing: Price differentiation based on the resources required for the service (like different types of vehicles or equipment).
 *
 * 5. Customer-Based Pricing: Adjust prices based on the customer's characteristics, such as their location or loyalty status.
 *
 * 6. Location-Based Pricing: Different prices for different locations, such as different cities or neighborhoods.
 *
 * 7. Channel-Based Pricing: Different prices for different booking channels, such as online versus in-person.
 */
import {dayAndTimePeriod, DayAndTimePeriod, dayAndTimePeriodFns, minutes, price, Price} from './types.js';
import {calcSlotPeriod} from './calculateAvailability.js';
import {AvailableSlot} from "./availability.js";

export interface PercentageBasedPriceAdjustment {
    _type: 'percentage.based.price.adjustment';
    percentage: number;
}

export function percentageBasedPriceAdjustment(percentage: number): PercentageBasedPriceAdjustment {
    return {
        _type: 'percentage.based.price.adjustment',
        percentage
    };
}

export interface AmountBasedPriceAdjustment {
    _type: 'amount.based.price.adjustment';
    amount: Price;
}

export function amountBasedPriceAdjustment(amount: Price): AmountBasedPriceAdjustment {
    return {
        _type: 'amount.based.price.adjustment',
        amount
    };
}

export type PriceAdjustment = PercentageBasedPriceAdjustment | AmountBasedPriceAdjustment;

export interface TimeBasedPriceAdjustment {
    _type: 'time.based.price.adjustment';
    time: DayAndTimePeriod;
    adjustment: PriceAdjustment;
}

export function timeBasedPriceAdjustment(time: DayAndTimePeriod, adjustment: PriceAdjustment): TimeBasedPriceAdjustment {
    return {
        _type: 'time.based.price.adjustment',
        time,
        adjustment
    };
}

export type PricingRule = TimeBasedPriceAdjustment;

export interface PricedSlot {
    _type: 'priced.slot';
    slot: AvailableSlot;
    price: Price;
    adjustments: PriceAdjustment[];
}

export function pricedSlot(slot: AvailableSlot, price: Price, adjustments: PriceAdjustment[]): PricedSlot {
    return {
        _type: 'priced.slot',
        slot,
        price,
        adjustments
    };
}

function applyPriceAdjustment(slot: PricedSlot, pricingRule: TimeBasedPriceAdjustment): PricedSlot {
    if (pricingRule.adjustment._type === 'amount.based.price.adjustment') {
        return pricedSlot(slot.slot, price(slot.price.amount.value + pricingRule.adjustment.amount.amount.value, slot.price.currency), [
            ...slot.adjustments,
            pricingRule.adjustment
        ]);
    }
    return pricedSlot(slot.slot, price(slot.price.amount.value + slot.price.amount.value * pricingRule.adjustment.percentage, slot.price.currency), [
        ...slot.adjustments,
        pricingRule.adjustment
    ]);
}

function applyTimeBasedPriceAdjustment(slot: PricedSlot, pricingRule: TimeBasedPriceAdjustment): PricedSlot {
    const period = calcSlotPeriod(slot.slot.startTime, minutes(0))
    const dayTime = dayAndTimePeriod(slot.slot.date, period);
    const overlaps = dayAndTimePeriodFns.overlaps(pricingRule.time, dayTime);
    if (overlaps) {
        return applyPriceAdjustment(slot, pricingRule);
    }
    return slot;
}

function applyPricingRule(givenPricedSlot: PricedSlot, pricingRule: PricingRule): PricedSlot {
    if (pricingRule._type === 'time.based.price.adjustment') {
        return applyTimeBasedPriceAdjustment(givenPricedSlot, pricingRule);
    }
    return givenPricedSlot;
}

export function calculatePrice(slot: AvailableSlot, pricingRules: PricingRule[]): PricedSlot {
    return pricingRules.reduce(applyPricingRule, pricedSlot(slot, slot.service.price, []));
}
