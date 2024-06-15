import {
    availabilityBlock,
    Booking,
    businessAvailability,
    businessConfiguration,
    carwash,
    carwashForm,
    coupon,
    couponCode,
    Customer,
    customer,
    customerForm,
    dayAndTimePeriod,
    duration,
    environmentId,
    IsoDate,
    isoDate,
    isoDateFns,
    minutes,
    PaymentIntent,
    percentageAsRatio,
    percentageCoupon,
    periodicStartTime,
    resourceDayAvailability,
    tenantEnvironment,
    tenantId,
    tenantSettings,
    time24,
    timePeriod,
    timezone,
    unlimited
} from '@breezbook/packages-core';
import {PricedBasket, pricedCreateOrderRequest} from '@breezbook/backend-api-types';
import {everythingForAvailability} from '../src/express/getEverythingForAvailability.js';
import {
    percentageBasedPriceAdjustment,
    timeBasedPriceAdjustment
} from '@breezbook/packages-core/dist/calculatePrice.js';
import {EndpointOutcome} from "../src/infra/endpoint.js";

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

const fortyPercentMoreToday = timeBasedPriceAdjustment(
    dayAndTimePeriod(isoDate(), timePeriod(time24('00:00'), time24('23:59'))),
    percentageBasedPriceAdjustment(0.4)
);
const twentyFivePercentMoreTomorrow = timeBasedPriceAdjustment(
    dayAndTimePeriod(tomorrow, timePeriod(time24('00:00'), time24('23:59'))),
    percentageBasedPriceAdjustment(0.25)
);
const tenPercentMoreTwoDaysFromNow = timeBasedPriceAdjustment(
    dayAndTimePeriod(twoDaysFromNow, timePeriod(time24('00:00'), time24('23:59'))),
    percentageBasedPriceAdjustment(0.1)
);

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
            [carwash.smallCarWash],
            carwash.addOns,
            carwash.timeslots,
            [carwashForm, customerForm],
            periodicStartTime(duration(minutes(90))),
            null
        ),
        [fortyPercentMoreToday, twentyFivePercentMoreTomorrow, tenPercentMoreTwoDaysFromNow],
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
    if(!httpOutcome) {
        throw new Error(`Expected http response but got ${JSON.stringify(outcome)}`);
    }
    if(httpOutcome._type !== "http.response.outcome") {
        throw new Error(`Expected http response but got ${httpOutcome._type}`);
    }
    const response = httpOutcome.response;
    if(response.status !== 200) {
        throw new Error(`Expected 200 response but got ${response.status} : ${response.body}`);
    }
    return JSON.parse(response.body) as T;
}