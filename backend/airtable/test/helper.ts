import {
	Booking,
	businessAvailability,
	businessConfiguration,
	carwash,
	carwashForm,
	coupon,
	couponCode,
	customer,
	customerForm,
	dayAndTimePeriod,
	duration,
	environmentId,
	fullPaymentOnCheckout,
	isoDate,
	isoDateFns,
	Order,
	percentageAsRatio,
	percentageCoupon,
	periodicStartTime,
	Price,
	resourceDayAvailability,
	tenantEnvironment,
	tenantId,
	tenantSettings,
	time24,
	timePeriod,
	timezone,
	unlimited
} from '@breezbook/packages-core';
import { createOrderRequest } from '@breezbook/backend-api-types';
import { everythingForTenant } from '../src/express/getEverythingForTenant.js';
import { percentageBasedPriceAdjustment, timeBasedPriceAdjustment } from '@breezbook/packages-core/dist/calculatePrice.js';

export const today = isoDate();
export const tomorrow = isoDateFns.addDays(isoDate(), 1);
export const twoDaysFromNow = isoDateFns.addDays(isoDate(), 2);
export const threeDaysFromNow = isoDateFns.addDays(isoDate(), 3);
export const fourDaysFromNow = isoDateFns.addDays(isoDate(), 4);

export async function postOrder(order: Order, total: Price, port: number) {
	const body = createOrderRequest(order, total, fullPaymentOnCheckout());
	return await fetch(`http://localhost:${port}/api/dev/tenant1/orders`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
}

export const goodCustomer = customer('Mike', 'Hogan', 'mike@email.com', {
	phone: '23678482376',
	firstLineOfAddress: '1 Main Street',
	postcode: 'SW1'
});

export const goodServiceFormData = {
	make: 'Ford',
	model: 'Focus',
	colour: 'Black',
	year: 2021
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

export function everythingForCarWashTenantWithDynamicPricing(bookings: Booking[] = [], today = isoDate()) {
	return everythingForTenant(
		businessConfiguration(
			businessAvailability([dayAndTimePeriod(today, carwash.nineToSix)]),
			[resourceDayAvailability(carwash.van1, [dayAndTimePeriod(today, carwash.nineToSix)])],
			[carwash.smallCarWash],
			carwash.addOns,
			carwash.timeslots,
			[carwashForm, customerForm],
			periodicStartTime(duration(90)),
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
