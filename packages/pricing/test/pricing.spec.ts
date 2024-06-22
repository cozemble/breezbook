import {expect, test} from 'vitest'
import jexl from 'jexl';

const jexlInstance = new jexl.Jexl();

interface BookingDateAttribute {
    type: 'bookingDate';
    value: string;
}

interface BookingStartTimeAttribute {
    type: 'bookingStartTime'
    value: string;
}

interface DaysUntilBookingAttribute {
    type: 'daysUntilBooking';
    value: number;
}

interface MonthOfBookingAttribute {
    type: 'monthOfBooking';
    value: number;
}

function bookingDateAttribute(value: string): BookingDateAttribute {
    return {type: 'bookingDate', value}
}

function bookingStartTimeAttribute(value: string): BookingStartTimeAttribute {
    return {type: 'bookingStartTime', value}
}

function daysUntilBookingAttribute(value: number): DaysUntilBookingAttribute {
    return {type: 'daysUntilBooking', value}
}

function monthOfBookingAttribute(value: number): MonthOfBookingAttribute {
    return {type: 'monthOfBooking', value}
}

type PricingAttribute =
    BookingDateAttribute
    | BookingStartTimeAttribute
    | DaysUntilBookingAttribute
    | MonthOfBookingAttribute;

interface Price {
    _type: 'price';
    amountInMinorUnits: number;
}

function price(amountInMinorUnits: number): Price {
    return {_type: 'price', amountInMinorUnits}
}

interface PriceAdjustment {
    ruleId: string;
    ruleName: string;
    originalPrice: Price;
    adjustedPrice: Price;
    explanation: string;
}

interface PricingResult {
    finalPrice: Price;
    basePrice: Price;
    adjustments: PriceAdjustment[];
}

function pricingResult(basePrice: Price, finalPrice: Price = basePrice, adjustments: PriceAdjustment[] = []): PricingResult {
    return {finalPrice, basePrice, adjustments}
}

interface ConditionalMutation {
    jexlCondition?: string;
    jexlExpression: string;
    description: string;
}

interface PricingRule {
    id: string;
    name: string;
    description: string;
    requiredAttributes: string[];
    mutations: ConditionalMutation[];
    applyAllOrFirst: 'all' | 'first';
}

class PricingEngine {
    private rules: PricingRule[] = [];

    addRule(rule: PricingRule) {
        this.rules.push(rule);
    }

    calculatePrice(basePrice: Price, attributes: PricingAttribute[]): PricingResult {
        const result = pricingResult(basePrice);

        for (const rule of this.rules) {
            if (rule.requiredAttributes.every(factor => attributes.some(f => f.type === factor))) {
                const outcome = this.executeRule(rule, result.finalPrice, attributes);
                if (outcome.finalPrice.amountInMinorUnits !== result.finalPrice.amountInMinorUnits) {
                    result.finalPrice = outcome.finalPrice;
                    result.adjustments.push(...outcome.adjustments);

                }
            }
        }
        return result;
    }

    private executeRule(rule: PricingRule, currentPrice: Price, attributes: PricingAttribute[]): PricingResult {
        const context = this.attributesToContext(attributes, currentPrice);
        const result = pricingResult(currentPrice);
        for (const mutation of rule.mutations) {
            const condition = mutation.jexlCondition || 'true';
            const shouldApply = jexlInstance.evalSync(condition, context);
            if (shouldApply) {
                const newPrice = price(jexlInstance.evalSync(mutation.jexlExpression, context));
                result.finalPrice = newPrice;
                result.adjustments.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    originalPrice: currentPrice,
                    adjustedPrice: newPrice,
                    explanation: mutation.description
                });
                if (rule.applyAllOrFirst === 'first') {
                    break;
                }
            }
        }
        return result;
    }

    private attributesToContext(attributes: PricingAttribute[], currentPrice: Price) {
        const context = {
            currentPrice: currentPrice.amountInMinorUnits
        } as any;
        for (const attribute of attributes) {
            context[attribute.type] = attribute.value;
        }
        return context;
    }
}

const moreExpensiveAfterSixPm: PricingRule = {
    id: 'more-expensive-after-six-pm',
    name: 'More Expensive After 6pm',
    description: 'Increase price by 10% after 6pm',
    requiredAttributes: ['bookingStartTime'],
    mutations: [
        {
            jexlCondition: 'bookingStartTime >= "18:00"',
            jexlExpression: 'currentPrice * 1.1',
            description: '10% increase applied for evening service',
        }
    ],
    applyAllOrFirst: 'all'
}

const lastMinuteBookingsAreMoreExpensive: PricingRule = {
    id: 'last-minute-booking',
    name: 'Last Minute Booking',
    description: 'Increase price for bookings that are happening soon',
    requiredAttributes: ['daysUntilBooking'],
    mutations: [
        {
            jexlCondition: 'daysUntilBooking == 0',
            jexlExpression: 'currentPrice * 1.4',
            description: '40% increase applied for booking today',
        },
        {
            jexlCondition: 'daysUntilBooking == 1',
            jexlExpression: 'currentPrice * 1.2',
            description: '20% increase applied for booking tomorrow',
        },
        {
            jexlCondition: 'daysUntilBooking == 2',
            jexlExpression: 'currentPrice * 1.1',
            description: '10% increase applied for booking two days from now',
        }
    ],
    applyAllOrFirst: 'first'
}

const summerDiscount: PricingRule = {
    id: 'summer-discount',
    name: 'Summer Discount',
    description: 'Apply a 10% discount during summer months',
    requiredAttributes: ['monthOfBooking'],
    mutations: [
        {
            jexlCondition: 'monthOfBooking >= 5 && monthOfBooking <= 7',
            jexlExpression: 'currentPrice * 0.9',
            description: '10% summer discount applied',
        }
    ],
    applyAllOrFirst: 'all'
}

const pricingEngine = new PricingEngine();
pricingEngine.addRule(moreExpensiveAfterSixPm);
pricingEngine.addRule(lastMinuteBookingsAreMoreExpensive);
pricingEngine.addRule(summerDiscount);

const basePrice = price(10000); // £100.00

test("price is untouched when there are no rules to apply", () => {
    const priced = pricingEngine.calculatePrice(basePrice, []);
    expect(priced).toEqual(pricingResult(basePrice, basePrice, []))
})

test("price is adjusted for time-based rule", () => {
    const pricingFactors: PricingAttribute[] = [
        bookingStartTimeAttribute('19:00:00'),
    ];

    const priced = pricingEngine.calculatePrice(basePrice, pricingFactors);
    expect(priced.finalPrice).toEqual(price(11000))
    expect(priced.adjustments).toEqual([
        {
            "ruleId": "more-expensive-after-six-pm",
            "ruleName": "More Expensive After 6pm",
            originalPrice: basePrice,
            adjustedPrice: price(11000),
            explanation: "10% increase applied for evening service",
        }
    ])
})

test("price is adjusted for last minute booking", () => {
    const bookingToday: PricingAttribute[] = [
        daysUntilBookingAttribute(0),
    ];

    const pricedForToday = pricingEngine.calculatePrice(basePrice, bookingToday);
    expect(pricedForToday.finalPrice).toEqual(price(14000))
    expect(pricedForToday.adjustments).toEqual([
        {
            "ruleId": "last-minute-booking",
            "ruleName": "Last Minute Booking",
            originalPrice: basePrice,
            adjustedPrice: price(14000),
            explanation: "40% increase applied for booking today",
        }
    ])

    const bookingTomorrow: PricingAttribute[] = [
        daysUntilBookingAttribute(1),
    ];
    const pricedForTomorrow = pricingEngine.calculatePrice(basePrice, bookingTomorrow);
    expect(pricedForTomorrow.finalPrice).toEqual(price(12000))
    expect(pricedForTomorrow.adjustments).toEqual([
        {
            "ruleId": "last-minute-booking",
            "ruleName": "Last Minute Booking",
            originalPrice: basePrice,
            adjustedPrice: price(12000),
            explanation: "20% increase applied for booking tomorrow",
        }
    ])

    const bookingTwoDays: PricingAttribute[] = [
        daysUntilBookingAttribute(2),
    ];
    const pricedForTwoDays = pricingEngine.calculatePrice(basePrice, bookingTwoDays);
    expect(pricedForTwoDays.finalPrice).toEqual(price(11000))
    expect(pricedForTwoDays.adjustments).toEqual([
        {
            "ruleId": "last-minute-booking",
            "ruleName": "Last Minute Booking",
            originalPrice: basePrice,
            adjustedPrice: price(11000),
            explanation: "10% increase applied for booking two days from now",
        }
    ])

    const bookingThreeDays: PricingAttribute[] = [
        daysUntilBookingAttribute(3),
    ];
    const pricedForThreeDays = pricingEngine.calculatePrice(basePrice, bookingThreeDays);
    expect(pricedForThreeDays.finalPrice).toEqual(basePrice)
});

test("price is adjusted for summer discount", () => {
    const bookingInSummer: PricingAttribute[] = [
        monthOfBookingAttribute(6),
    ];

    const pricedForSummer = pricingEngine.calculatePrice(basePrice, bookingInSummer);
    expect(pricedForSummer.finalPrice).toEqual(price(9000))
    expect(pricedForSummer.adjustments).toEqual([
        {
            "ruleId": "summer-discount",
            "ruleName": "Summer Discount",
            originalPrice: basePrice,
            adjustedPrice: price(9000),
            explanation: "10% summer discount applied",
        }
    ])

    const bookingInWinter: PricingAttribute[] = [
        monthOfBookingAttribute(12),
    ];

    const pricedForWinter = pricingEngine.calculatePrice(basePrice, bookingInWinter);
    expect(pricedForWinter.finalPrice).toEqual(basePrice)
});