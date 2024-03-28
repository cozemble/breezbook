import { expect, test } from 'vitest';
import {
	booking,
	carwash,
	couponCode,
	currency,
	customer,
	customerId,
	fullPaymentOnCheckout,
	id,
	order,
	orderFns,
	orderLine,
	price,
	priceFns
} from '@breezbook/packages-core';
import { everythingForCarWashTenantWithDynamicPricing, fourDaysFromNow, goodCustomer, goodServiceFormData, today } from './helper.js';
import { createOrderRequest, ErrorResponse } from '@breezbook/backend-api-types';
import { addOrderErrorCodes, doAddOrder } from '../src/express/addOrder.js';

test('tenant has a customer form, and the customer does not have a form response', () => {
	const theCustomer = customer('Mike', 'Hogan', 'mike@email.com');
	const theOrder = order(theCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.customerFormMissing);
});

test('tenant has a customer form, and submitted form does not validate', () => {
	const mike = customer('Mike', 'Hogan', 'mike@email.com', {});
	const theOrder = order(mike, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.customerFormInvalid);
	expect(outcome.errorMessage).toBeDefined();
});

test('service has a service form, and the service does not have a form response', () => {
	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.serviceFormMissing);
	expect(outcome.errorMessage).toBeDefined();
});

test('service has a service form, and the service form is invalid', () => {
	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [{}])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.serviceFormInvalid);
	expect(outcome.errorMessage).toBeDefined();
});

test('error message when posted price is not the same as the server side calculated price', () => {
	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [goodServiceFormData])]);
	const request = createOrderRequest(theOrder, price(100, currency('GBP')), fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.wrongTotalPrice);
	expect(outcome.errorMessage).toBeDefined();
});

test('error message when no availability', () => {
	const booking1 = booking(customerId('customer#1'), carwash.smallCarWash.id, today, carwash.nineToOne);
	const booking2 = booking(customerId('customer#1'), carwash.smallCarWash.id, today, carwash.nineToOne);

	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [goodServiceFormData])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([booking1, booking2]), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.noAvailability);
	expect(outcome.errorMessage).toBeDefined();
});

test('an order with an non-existent coupon code should fail with an error code', () => {
	let theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [goodServiceFormData])]);
	theOrder = orderFns.addCoupon(theOrder, couponCode('this-does-not-exist'));
	const request = createOrderRequest(theOrder, price(100, currency('GBP')), fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.noSuchCoupon);
	expect(outcome.errorMessage).toBeDefined();
});

test('an order with an expired coupon should fail with an error code', () => {
	let theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [goodServiceFormData])]);
	theOrder = orderFns.addCoupon(theOrder, couponCode('expired-20-percent-off'));
	const request = createOrderRequest(theOrder, price(100, currency('GBP')), fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.expiredCoupon);
	expect(outcome.errorMessage).toBeDefined();
});

test('an order intending full payment on checkout should reserve the booking', () => {
	const theOrder = order(goodCustomer, [
		orderLine(
			carwash.smallCarWash.id,
			price(carwash.smallCarWash.price.amount.value * 1.4, carwash.smallCarWash.price.currency),
			[],
			today,
			carwash.nineToOne,
			[goodServiceFormData]
		)
	]);
	const request = createOrderRequest(
		theOrder,
		price(carwash.smallCarWash.price.amount.value * 1.4, carwash.smallCarWash.price.currency),
		fullPaymentOnCheckout()
	);
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request);
	if (!outcome || outcome._type !== 'success') {
		throw new Error('Expected success, got ' + JSON.stringify(outcome));
	}
	expect(outcome.mutations.mutations.some((m) => m._type === 'create' && m.entity === 'reservations')).toBeDefined();
});

test('an order with a non-existent timeslot by id should result in an error', () => {
	const timeslot = { ...carwash.oneToFour, id: id('this-does-not-exist') };
	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, timeslot, [goodServiceFormData])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.noSuchTimeslotId);
	expect(outcome.errorMessage).toBeDefined();
});

test('an order with a coupon code should apply the discount', () => {
	const theOrder = orderFns.addCoupon(
		order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], fourDaysFromNow, carwash.nineToOne, [goodServiceFormData])]),
		couponCode('20-percent-off')
	);
	const request = createOrderRequest(theOrder, priceFns.multiply(carwash.smallCarWash.price, 0.8), fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fourDaysFromNow), request);
	if (!outcome || outcome._type !== 'success') {
		throw new Error('Expected success, got ' + JSON.stringify(outcome));
	}
	expect(outcome.orderCreatedResponse.bookingIds).toHaveLength(1);
});

test('the customer and service forms should be persisted', () => {
	const theOrder = orderFns.addCoupon(
		order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], fourDaysFromNow, carwash.nineToOne, [goodServiceFormData])]),
		couponCode('20-percent-off')
	);
	const request = createOrderRequest(theOrder, priceFns.multiply(carwash.smallCarWash.price, 0.8), fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fourDaysFromNow), request);
	if (!outcome || outcome._type !== 'success') {
		throw new Error('Expected success, got ' + JSON.stringify(outcome));
	}
	const customerFormUpsert = outcome.mutations.mutations.find((mutation) => mutation._type === 'upsert' && mutation.update.entity === 'customer_form_values');
	expect(customerFormUpsert).toBeDefined();
	const serviceFormUpsert = outcome.mutations.mutations.find(
		(mutation) => mutation._type === 'upsert' && mutation.update.entity === 'booking_service_form_values'
	);
	expect(serviceFormUpsert).toBeDefined();
});
