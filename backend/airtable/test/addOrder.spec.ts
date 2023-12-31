import { beforeAll, describe, expect, test } from 'vitest';
import {
	addOnOrder,
	carwash,
	couponCode,
	currency,
	customer,
	fullPaymentOnCheckout,
	isoDate,
	isoDateFns,
	Order,
	order,
	orderFns,
	orderLine,
	price,
	Price,
	priceFns
} from '@breezbook/packages-core';
import { createOrderRequest, ErrorResponse, OrderCreatedResponse } from '@breezbook/backend-api-types';
import { appWithTestContainer } from '../src/infra/appWithTestContainer.js';
import { addOrderErrorCodes } from '../src/express/addOrder.js';

const port = 3003;
const tomorrow = isoDateFns.addDays(isoDate(), 1);
const threeDaysFromNow = isoDateFns.addDays(isoDate(), 3);
const fourDaysFromNow = isoDateFns.addDays(isoDate(), 4);

async function postOrder(order: Order, total: Price) {
	const body = createOrderRequest(order, total, fullPaymentOnCheckout());
	return await fetch(`http://localhost:${port}/api/dev/tenant1/orders`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
}

const goodCustomer = customer('Mike', 'Hogan', 'mike@email.com', {
	phone: '23678482376',
	firstLineOfAddress: '1 Main Street',
	postcode: 'SW1'
});

const goodServiceFormData = {
	make: 'Ford',
	model: 'Focus',
	colour: 'Black',
	year: 2021
};

describe('with a migrated database', () => {
	beforeAll(async () => {
		try {
			await appWithTestContainer(port);
		} catch (e) {
			console.error(e);
			throw e;
		}
	}, 1000 * 90);

	test('tenant has a customer form, and the customer does not have a form response', async () => {
		const mike = customer('Mike', 'Hogan', 'mike@email.com');
		const theOrder = order(mike, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.nineToOne, [])
		]);
		const response = await postOrder(theOrder, priceFns.add(carwash.smallCarWash.price, carwash.wax.price));
		expect(response.status).toBe(400);
		const json = (await response.json()) as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.customerFormMissing);
	});

	test('tenant has a customer form, and submitted form does not validate', async () => {
		const mike = customer('Mike', 'Hogan', 'mike@email.com', {});
		const theOrder = order(mike, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.nineToOne, [])
		]);
		const response = await postOrder(theOrder, priceFns.add(carwash.smallCarWash.price, carwash.wax.price));
		expect(response.status).toBe(400);
		const json = (await response.json()) as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.customerFormInvalid);
		expect(json.errorMessage).toBeDefined();
	});

	test('service has a service form, and the service does not have a form response', async () => {
		const theOrder = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.nineToOne, [])
		]);
		const response = await postOrder(theOrder, priceFns.add(carwash.smallCarWash.price, carwash.wax.price));
		expect(response.status).toBe(400);
		const json = (await response.json()) as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.serviceFormMissing);
		expect(json.errorMessage).toBeDefined();
	});

	test('service has a service form, and the service form is invalid', async () => {
		const theOrder = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.nineToOne, [{}])
		]);
		const response = await postOrder(theOrder, priceFns.add(carwash.smallCarWash.price, carwash.wax.price));
		expect(response.status).toBe(400);
		const json = (await response.json()) as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.serviceFormInvalid);
		expect(json.errorMessage).toBeDefined();
	});

	test('can add an order for two car washes, each with different add-ons', async () => {
		const twoServices = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], fourDaysFromNow, carwash.nineToOne, [goodServiceFormData]),
			orderLine(
				carwash.mediumCarWash.id,
				carwash.mediumCarWash.price,
				[addOnOrder(carwash.wax.id), addOnOrder(carwash.polish.id)],
				fourDaysFromNow,
				carwash.nineToOne,
				[goodServiceFormData]
			)
		]);

		const fetched = await postOrder(
			twoServices,
			priceFns.add(carwash.smallCarWash.price, carwash.wax.price, carwash.mediumCarWash.price, carwash.wax.price, carwash.polish.price)
		);
		if (!fetched.ok) {
			console.error(await fetched.text());
			throw new Error(`Failed to add order`);
		}
		const json = (await fetched.json()) as OrderCreatedResponse;
		expect(json.orderId).toBeDefined();
		expect(json.customerId).toBeDefined();
		expect(json.bookingIds.length).toBe(2);
		expect(json.orderLineIds.length).toBe(2);
	});

	test('error message when posted price is not the same as the server side calculated price', async () => {
		const theOrder = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.nineToOne, [goodServiceFormData])
		]);
		const response = await postOrder(theOrder, price(100, currency('GBP')));
		expect(response.status).toBe(400);
		const json = (await response.json()) as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.wrongTotalPrice);
		expect(json.errorMessage).toBeDefined();
	});

	test('error message when no availability', async () => {
		const theOrder = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], threeDaysFromNow, carwash.fourToSix, [goodServiceFormData])
		]);

		const response1 = await postOrder(theOrder, carwash.smallCarWash.price);
		expect(response1.status).toBe(200);

		const response2 = await postOrder(theOrder, carwash.smallCarWash.price);
		expect(response2.status).toBe(200);

		const response3 = await postOrder(theOrder, carwash.smallCarWash.price);

		expect(response3.status).toBe(400);
		const json = (await response3.json()) as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.noAvailability);
		expect(json.errorMessage).toBeDefined();
	});

	test('an order with an non-existent coupon code should fail with an error code', async () => {
		let theOrder = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], tomorrow, carwash.oneToFour, [goodServiceFormData])
		]);
		theOrder = orderFns.addCoupon(theOrder, couponCode('this-does-not-exist'));
		const response = await postOrder(theOrder, carwash.smallCarWash.price);

		expect(response.status).toBe(400);
		const json = (await response.json()) as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.noSuchCoupon);
		expect(json.errorMessage).toBeDefined();
	});

	test('an order with an expired coupon should fail with an error code', async () => {
		let theOrder = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], tomorrow, carwash.oneToFour, [goodServiceFormData])
		]);
		theOrder = orderFns.addCoupon(theOrder, couponCode('expired-20-percent-off'));
		const response = await postOrder(theOrder, carwash.smallCarWash.price);

		expect(response.status).toBe(400);
		const json = (await response.json()) as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.expiredCoupon);
		expect(json.errorMessage).toBeDefined();
	});

	test('an order intending full payment on checkout should reserve the booking', async () => {
		const theOrder = order(goodCustomer, [
			orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [], fourDaysFromNow, carwash.oneToFour, [goodServiceFormData])
		]);
		const response = await postOrder(theOrder, carwash.smallCarWash.price);

		expect(response.status).toBe(200);
		const json = (await response.json()) as OrderCreatedResponse;
		expect(json.orderId).toBeDefined();
		expect(json.customerId).toBeDefined();
		expect(json.bookingIds.length).toBe(1);
		expect(json.orderLineIds.length).toBe(1);
		expect(json.reservationIds.length).toBe(1);
	});
});
