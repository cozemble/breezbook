import {expect, test} from 'vitest'
import {
    add,
    jexlExpression,
    jexlMutation,
    multiply,
    price,
    PricingEngine,
    PricingFactor,
    pricingFactorName,
    pricingResult,
    PricingRule
} from "../src/pricing.js";

interface BookingStartTimeFactor extends PricingFactor<string> {
    name: 'bookingStartTime'
    value: string;
}

interface DaysUntilBookingFactor extends PricingFactor<number> {
    name: 'daysUntilBooking';
    value: number;
}

interface MonthOfBookingFactor extends PricingFactor<number> {
    name: 'monthOfBooking';
    value: number;
}

function bookingStartTimeFactor(value: string): BookingStartTimeFactor {
    return {name: 'bookingStartTime', value}
}

function daysUntilBookingFactor(value: number): DaysUntilBookingFactor {
    return {name: 'daysUntilBooking', value}
}

function monthOfBookingFactor(value: number): MonthOfBookingFactor {
    return {name: 'monthOfBooking', value}
}

const moreExpensiveAfterSixPm: PricingRule = {
    id: 'more-expensive-after-six-pm',
    name: 'More Expensive After 6pm',
    description: 'Increase price by 10% after 6pm',
    requiredFactors: [pricingFactorName('bookingStartTime')],
    mutations: [
        {
            condition: jexlExpression('bookingStartTime >= "18:00"'),
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
    requiredFactors: [pricingFactorName('daysUntilBooking')],
    mutations: [
        {
            condition: jexlExpression('daysUntilBooking == 0'),
            mutation: multiply(1.4),
            description: '40% increase applied for booking today',
        },
        {
            condition: jexlExpression('daysUntilBooking == 1'),
            mutation: multiply(1.2),
            description: '20% increase applied for booking tomorrow',
        },
        {
            condition: jexlExpression('daysUntilBooking == 2'),
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
    requiredFactors: [pricingFactorName('monthOfBooking')],
    mutations: [
        {
            condition: jexlExpression('monthOfBooking >= 5 && monthOfBooking <= 7'),
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
    requiredFactors: [pricingFactorName('instructorNames')],
    mutations: [
        {
            condition: jexlExpression("instructorNames[.name == 'Mike'] | length > 0"),
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
    requiredFactors: [pricingFactorName('resourceMetadata')],
    mutations: [
        {
            condition: jexlExpression("resourceMetadata | filter('metadata.tier', '== 1') | length > 0"),
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

test("deals with rounding errors", () => {
    const bookingInTwoDays: PricingFactor[] = [
        daysUntilBookingFactor(2),
    ];

    const pricedForToday = pricingEngine.calculatePrice(price(6500), bookingInTwoDays);
    expect(pricedForToday.finalPrice).toEqual(price(7150))
})

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
        name: 'instructorNames',
        value: [{name: 'Mike'}]
    }]);
    expect(pricedForMike.finalPrice).toEqual(price(11000))

    const pricedForNotMike = pricingEngine.calculatePrice(basePrice, [{
        name: 'instructorNames',
        value: [{name: 'John'}]
    }]);
    expect(pricedForNotMike.finalPrice).toEqual(basePrice)
})

test("extended jexl can filter on deeply nested properties", () => {
    const pricedForTier1 = pricingEngine.calculatePrice(basePrice, [{
        name: 'resourceMetadata',
        value: [{metadata: {tier: 1}}]
    }]);
    expect(pricedForTier1.finalPrice).toEqual(price(12000))

    const pricedForTier2 = pricingEngine.calculatePrice(basePrice, [{
        name: 'resourceMetadata',
        value: [{metadata: {tier: 2}}]
    }]);
    expect(pricedForTier2.finalPrice).toEqual(basePrice)
})

test("rules can have their own context", () => {
    const twiceThePriceOnHolidays: PricingRule = {
        id: 'twice-the-price-on-holidays',
        name: 'Twice The Price On Holidays',
        description: 'Double the price on holidays',
        context: {
            holidays: ['2024-12-25', '2024-12-26']
        },
        requiredFactors: [pricingFactorName('bookingDate')],
        mutations: [
            {
                condition: jexlExpression('holidays | includes(bookingDate)'),
                mutation: jexlMutation('currentPrice * 2'),
                description: 'Double the price on holidays',
            }
        ],
        applyAllOrFirst: 'all'
    }
    const pricingEngine = new PricingEngine();
    pricingEngine.addRule(twiceThePriceOnHolidays);

    const priceForXmas = pricingEngine.calculatePrice(basePrice, [{
        name: 'bookingDate',
        value: '2024-12-25'
    }]);
    expect(priceForXmas.finalPrice).toEqual(price(20000))

    const priceForBoxingDay = pricingEngine.calculatePrice(basePrice, [{
        name: 'bookingDate',
        value: '2024-12-26'
    }]);
    expect(priceForBoxingDay.finalPrice).toEqual(price(20000))

    const priceForNormal = pricingEngine.calculatePrice(basePrice, [{
        name: 'bookingDate',
        value: '2024-12-35'
    }]);
    expect(priceForNormal.finalPrice).toEqual(basePrice)
})

test("rules can have prep steps and reports", () => {
    const addMoreForEvening: PricingRule = {
        id: 'add-more-for-evening',
        name: 'Add More For Evening',
        description: 'Add more for evening hours between 18:00 and 24:00',
        requiredFactors: [pricingFactorName('numberOfEveningHours')],
        mutations: [
            {
                condition: jexlExpression('numberOfEveningHours > 0'),
                mutation: add(jexlExpression('numberOfEveningHours * 100')),
                description: 'Add £1 per-hour for evening bookings',
            },
        ],
        applyAllOrFirst: 'all'
    };

    const pricingEngine = new PricingEngine();
    pricingEngine.addRule(addMoreForEvening);

    const priceForNormalHours = pricingEngine.calculatePrice(basePrice, [{
        name: 'numberOfEveningHours',
        value: 0
    }]);

    expect(priceForNormalHours.finalPrice).toEqual(basePrice)

    const priceForOnlyEveningHours = pricingEngine.calculatePrice(basePrice, [{
        name: 'numberOfEveningHours',
        value: 3
    }]);
    expect(priceForOnlyEveningHours.finalPrice).toEqual(price(10300))

    const pricingForPartialEveningHours = pricingEngine.calculatePrice(basePrice, [{
        name: 'numberOfEveningHours',
        value: 1.5
    }]);
    expect(pricingForPartialEveningHours.finalPrice).toEqual(price(10150))
})