import {
    Booking,
    businessAvailability,
    businessConfiguration,
    carwash,
    carwashForm, configuration,
    coupon,
    Customer,
    customer,
    customerForm,
    PaymentIntent,
    percentageAsRatio,
    percentageCoupon,
    periodicStartTime,
    tenantSettings,
    unlimited
} from '@breezbook/packages-core';
import {PricedBasket, pricedCreateOrderRequest} from '@breezbook/backend-api-types';
import {everythingForAvailability} from '../src/express/getEverythingForAvailability.js';
import {EndpointOutcome} from "../src/infra/endpoint.js";
import {jexlExpression, multiply, pricingFactorName, PricingRule} from "@breezbook/packages-pricing";
import {couponCode, dayAndTimePeriod, duration,
    environmentId, IsoDate, isoDate, isoDateFns, minutes, tenantEnvironment, tenantId, timezone} from '@breezbook/packages-types';
import resourceDayAvailability = configuration.resourceAvailability;
import availabilityBlock = configuration.availabilityBlock;

export const today = isoDate();
export const tomorrow = isoDateFns.addDays(isoDate(), 1);
export const twoDaysFromNow = isoDateFns.addDays(isoDate(), 2);
export const threeDaysFromNow = isoDateFns.addDays(isoDate(), 3);
export const fourDaysFromNow = isoDateFns.addDays(isoDate(), 4);
export const fiveDaysFromNow = isoDateFns.addDays(isoDate(), 5);


export async function postOrder(pricedBasket: PricedBasket, customer: Customer, paymentIntent: PaymentIntent, port: number) {
    const body = pricedCreateOrderRequest(pricedBasket, customer, paymentIntent);
    return await fetch(`http://localhost:${port}/api/dev/tenant1/orders`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

}

export const goodCustomer = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671", {age: 30});

export const goodServiceFormData = {
    make: 'Ford',
    model: 'Focus',
    colour: 'Black',
    year: 2021,
    firstLineOfAddress: '1 Main Street',
    postcode: 'SW1'
};

const chargeMoreForSoonBookings: PricingRule = {
    id: 'charge-more-for-soon-bookings',
    name: 'Charge More for Soon Bookings',
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


export function everythingForCarWashTenantWithDynamicPricing(bookings: Booking[] = [], today = isoDate(), otherDays: IsoDate[] = []) {
    const allDays = [today, ...otherDays];
    const theResourceAvailability = allDays.flatMap(day => [
        resourceDayAvailability(carwash.van1, [availabilityBlock(dayAndTimePeriod(day, carwash.nineToSix))]), resourceDayAvailability(carwash.van2, [availabilityBlock(dayAndTimePeriod(day, carwash.nineToSix))])]);
    const theBusinessAvailability = allDays.map(day => dayAndTimePeriod(day, carwash.nineToSix))

    return everythingForAvailability(
        businessConfiguration(
            businessAvailability(theBusinessAvailability),
            [carwash.van1, carwash.van2],
            theResourceAvailability,
            [],
            [carwash.smallCarWash],
            [],
            carwash.addOns,
            carwash.timeslots,
            [carwashForm, customerForm],
            periodicStartTime(duration(minutes(90))),
            null
        ),
        [chargeMoreForSoonBookings],
        bookings,
        [
            coupon(couponCode('expired-20-percent-off'), unlimited(), percentageCoupon(percentageAsRatio(0.2)), isoDate('2021-05-23'), isoDate('2021-05-26')),
            coupon(couponCode('20-percent-off'), unlimited(), percentageCoupon(percentageAsRatio(0.2)), isoDate('2021-05-23'))
        ],
        tenantSettings(timezone('Europe/London'), customerForm.id),
        tenantEnvironment(environmentId('dev'), tenantId('tenant#1'))
    );
}

export function expectJson<T = any>(outcome: EndpointOutcome[]): T {
    const httpOutcome = outcome.find(o => o._type === 'http.response.outcome');
    if (!httpOutcome) {
        throw new Error(`Expected http response but got ${JSON.stringify(outcome)}`);
    }
    if (httpOutcome._type !== "http.response.outcome") {
        throw new Error(`Expected http response but got ${httpOutcome._type}`);
    }
    const response = httpOutcome.response;
    if (response.status !== 200) {
        throw new Error(`Expected 200 response but got ${response.status} : ${response.body}`);
    }
    return JSON.parse(response.body) as T;
}