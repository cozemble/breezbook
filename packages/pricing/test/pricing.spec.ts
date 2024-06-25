import {expect, test} from 'vitest'
import {
    jexlCondition,
    jexlMutation,
    multiply,
    price,
    PricingEngine,
    PricingFactor,
    pricingResult,
    PricingRule
} from "../src/pricing.js";

interface BookingStartTimeFactor extends PricingFactor<string> {
    type: 'bookingStartTime'
    value: string;
}

interface DaysUntilBookingFactor extends PricingFactor<number> {
    type: 'daysUntilBooking';
    value: number;
}

interface MonthOfBookingFactor extends PricingFactor<number> {
    type: 'monthOfBooking';
    value: number;
}

function bookingStartTimeFactor(value: string): BookingStartTimeFactor {
    return {type: 'bookingStartTime', value}
}

function daysUntilBookingFactor(value: number): DaysUntilBookingFactor {
    return {type: 'daysUntilBooking', value}
}

function monthOfBookingFactor(value: number): MonthOfBookingFactor {
    return {type: 'monthOfBooking', value}
}

const moreExpensiveAfterSixPm: PricingRule = {
    id: 'more-expensive-after-six-pm',
    name: 'More Expensive After 6pm',
    description: 'Increase price by 10% after 6pm',
    requiredFactors: ['bookingStartTime'],
    mutations: [
        {
            condition: jexlCondition('bookingStartTime >= "18:00"'),
            mutation: jexlMutation('currentPrice * 1.1'),
            description: '10% increase applied for evening service',
        }
    ],
    applyAllOrFirst: 'all'
}

const lastMinuteBookingsAreMoreExpensive: PricingRule = {
    id: 'last-minute-booking',
    name: 'Last Minute Booking',
    description: 'Increase price for bookings that are happening soon',
    requiredFactors: ['daysUntilBooking'],
    mutations: [
        {
            condition: jexlCondition('daysUntilBooking == 0'),
            mutation: multiply(1.4),
            description: '40% increase applied for booking today',
        },
        {
            condition: jexlCondition('daysUntilBooking == 1'),
            mutation: multiply(1.2),
            description: '20% increase applied for booking tomorrow',
        },
        {
            condition: jexlCondition('daysUntilBooking == 2'),
            mutation: multiply(1.1),
            description: '10% increase applied for booking two days from now',
        }
    ],
    applyAllOrFirst: 'first'
}

const summerDiscount: PricingRule = {
    id: 'summer-discount',
    name: 'Summer Discount',
    description: 'Apply a 10% discount during summer months',
    requiredFactors: ['monthOfBooking'],
    mutations: [
        {
            condition: jexlCondition('monthOfBooking >= 5 && monthOfBooking <= 7'),
            mutation: jexlMutation('currentPrice * 0.9'),
            description: '10% summer discount applied',
        }
    ],
    applyAllOrFirst: 'all'
}

const moreExpensiveIfOneInstructorIsCalledMike: PricingRule = {
    id: 'more-expensive-if-one-instructor-is-called-mike',
    name: 'More Expensive If One Instructor Is Called Mike',
    description: 'Increase price by 10% if one of the instructors is called Mike',
    requiredFactors: ['instructorNames'],
    mutations: [
        {
            condition: jexlCondition("length(instructorNames[.name == 'Mike']) > 0"),
            mutation: jexlMutation('currentPrice * 1.1'),
            description: '10% increase applied for service with Mike',
        }
    ],
    applyAllOrFirst: 'all'
}

const moreExpensiveWhenMetadataTierIsOne: PricingRule = {
    id: 'more-expensive-when-metadata-tier-is-one',
    name: 'More Expensive When Metadata Tier Is One',
    description: 'Increase price by £20 when the resource has a tier of 1',
    requiredFactors: ['resourceMetadata'],
    mutations: [
        {
            condition: jexlCondition("length(resourceMetadata|filter('metadata.tier', 1)) > 0"),
            mutation: jexlMutation('currentPrice + 2000'),
            description: '£20 increase applied for tier 1 resource',
        }
    ],
    applyAllOrFirst: 'all'
}

const pricingEngine = new PricingEngine();
pricingEngine.addRule(moreExpensiveAfterSixPm);
pricingEngine.addRule(lastMinuteBookingsAreMoreExpensive);
pricingEngine.addRule(summerDiscount);
pricingEngine.addRule(moreExpensiveIfOneInstructorIsCalledMike);
pricingEngine.addRule(moreExpensiveWhenMetadataTierIsOne);

const basePrice = price(10000); // £100.00

test("price is untouched when there are no rules to apply", () => {
    const priced = pricingEngine.calculatePrice(basePrice, []);
    expect(priced).toEqual(pricingResult(basePrice, basePrice, []))
})

test("price is adjusted for time-based rule", () => {
    const pricingFactors: PricingFactor[] = [
        bookingStartTimeFactor('19:00:00'),
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
    const bookingToday: PricingFactor[] = [
        daysUntilBookingFactor(0),
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

    const bookingTomorrow: PricingFactor[] = [
        daysUntilBookingFactor(1),
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

    const bookingTwoDays: PricingFactor[] = [
        daysUntilBookingFactor(2),
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

    const bookingThreeDays: PricingFactor[] = [
        daysUntilBookingFactor(3),
    ];
    const pricedForThreeDays = pricingEngine.calculatePrice(basePrice, bookingThreeDays);
    expect(pricedForThreeDays.finalPrice).toEqual(basePrice)
});

test("price is adjusted for summer discount", () => {
    const bookingInSummer: PricingFactor[] = [
        monthOfBookingFactor(6),
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

    const bookingInWinter: PricingFactor[] = [
        monthOfBookingFactor(12),
    ];

    const pricedForWinter = pricingEngine.calculatePrice(basePrice, bookingInWinter);
    expect(pricedForWinter.finalPrice).toEqual(basePrice)
});

test("extended jexl has a some operator", () => {
    const pricedForMike = pricingEngine.calculatePrice(basePrice, [{
        type: 'instructorNames',
        value: [{name: 'Mike'}]
    }]);
    expect(pricedForMike.finalPrice).toEqual(price(11000))

    const pricedForNotMike = pricingEngine.calculatePrice(basePrice, [{
        type: 'instructorNames',
        value: [{name: 'John'}]
    }]);
    expect(pricedForNotMike.finalPrice).toEqual(basePrice)
})

test("extended jexl can filter on deeply nested properties", () => {
    const pricedForTier1 = pricingEngine.calculatePrice(basePrice, [{
        type: 'resourceMetadata',
        value: [{metadata: {tier: 1}}]
    }]);
    expect(pricedForTier1.finalPrice).toEqual(price(12000))

    const pricedForTier2 = pricingEngine.calculatePrice(basePrice, [{
        type: 'resourceMetadata',
        value: [{metadata: {tier: 2}}]
    }]);
    expect(pricedForTier2.finalPrice).toEqual(basePrice)

})