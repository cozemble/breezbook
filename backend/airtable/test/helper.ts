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
	unlimited
} from '@breezbook/packages-core';
import { createOrderRequest } from '@breezbook/backend-api-types';
import { everythingForTenant } from '../src/express/getEverythingForTenant.js';

export const today = isoDate();
export const tomorrow = isoDateFns.addDays(isoDate(), 1);
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

export function everythingForCarWashTenant(bookings: Booking[] = [], today = isoDate()) {
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
		[],
		bookings,
		[coupon(couponCode('expired-20-percent-off'), unlimited(), percentageCoupon(percentageAsRatio(0.2)), isoDate('2021-05-23'), isoDate('2021-05-26'))],
		tenantSettings(customerForm.id),
		tenantEnvironment(environmentId('dev'), tenantId('tenant#1'))
	);
}
