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
	price
} from '@breezbook/packages-core';
import { everythingForCarWashTenant, goodCustomer, goodServiceFormData, today } from './helper.js';
import { createOrderRequest, ErrorResponse } from '@breezbook/backend-api-types';
import { addOrderErrorCodes, doAddOrder } from '../src/express/addOrder.js';
import { Prisma } from '@prisma/client';

test('tenant has a customer form, and the customer does not have a form response', () => {
	const theCustomer = customer('Mike', 'Hogan', 'mike@email.com');
	const theOrder = order(theCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenant(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.customerFormMissing);
});

test('tenant has a customer form, and submitted form does not validate', () => {
	const mike = customer('Mike', 'Hogan', 'mike@email.com', {});
	const theOrder = order(mike, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenant(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.customerFormInvalid);
	expect(outcome.errorMessage).toBeDefined();
});

test('service has a service form, and the service does not have a form response', () => {
	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenant(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.serviceFormMissing);
	expect(outcome.errorMessage).toBeDefined();
});

test('service has a service form, and the service form is invalid', () => {
	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [{}])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenant(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.serviceFormInvalid);
	expect(outcome.errorMessage).toBeDefined();
});

test('error message when posted price is not the same as the server side calculated price', () => {
	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [goodServiceFormData])]);
	const request = createOrderRequest(theOrder, price(100, currency('GBP')), fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenant(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.wrongTotalPrice);
	expect(outcome.errorMessage).toBeDefined();
});

test('error message when no availability', () => {
	const booking1 = booking(customerId('customer#1'), carwash.smallCarWash.id, today, carwash.nineToOne);
	const booking2 = booking(customerId('customer#1'), carwash.smallCarWash.id, today, carwash.nineToOne);

	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [goodServiceFormData])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenant([booking1, booking2]), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.noAvailability);
	expect(outcome.errorMessage).toBeDefined();
});

test('an order with an non-existent coupon code should fail with an error code', () => {
	let theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [goodServiceFormData])]);
	theOrder = orderFns.addCoupon(theOrder, couponCode('this-does-not-exist'));
	const request = createOrderRequest(theOrder, price(100, currency('GBP')), fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenant(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.noSuchCoupon);
	expect(outcome.errorMessage).toBeDefined();
});

test('an order with an expired coupon should fail with an error code', () => {
	let theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [goodServiceFormData])]);
	theOrder = orderFns.addCoupon(theOrder, couponCode('expired-20-percent-off'));
	const request = createOrderRequest(theOrder, price(100, currency('GBP')), fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenant(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.expiredCoupon);
	expect(outcome.errorMessage).toBeDefined();
});

test('an order intending full payment on checkout should reserve the booking', () => {
	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, carwash.nineToOne, [goodServiceFormData])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenant(), request);
	if (!outcome || outcome._type !== 'success') {
		throw new Error('Expected success');
	}
	expect(outcome.prismaMutations.mutations.some((m) => m._type === 'prisma.create' && m.delegate === Prisma.reservationsDelegate)).toBeDefined();
});

test('an order with a non-existent timeslot by id should result in an error', () => {
	const timeslot = { ...carwash.oneToFour, id: id('this-does-not-exist') };
	const theOrder = order(goodCustomer, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], today, timeslot, [goodServiceFormData])]);
	const request = createOrderRequest(theOrder, carwash.smallCarWash.price, fullPaymentOnCheckout());
	const outcome = doAddOrder(everythingForCarWashTenant(), request) as ErrorResponse;
	expect(outcome.errorCode).toBe(addOrderErrorCodes.noSuchTimeslotId);
	expect(outcome.errorMessage).toBeDefined();
});
