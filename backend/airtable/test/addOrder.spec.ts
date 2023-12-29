import { beforeAll, describe, expect, test } from 'vitest';
import { addOnOrder, carwash, customer, isoDate, isoDateFns, Order, order, orderLine } from '@breezbook/packages-core';
import { ErrorResponse, OrderCreatedResponse } from '../src/apiTypes.js';
import { appWithTestContainer } from '../src/infra/appWithTestContainer.js';
import { addOrderErrorCodes } from '../src/express/addOrder.js';

const port = 3003;
const tomorrow = isoDateFns.addDays(isoDate(), 1);
const dayAfterTomorrow = isoDateFns.addDays(isoDate(), 2);

async function postOrder(order: Order) {
	return await fetch(`http://localhost:${port}/api/tenant1/orders`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(order)
	});
}

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
		const theOrder = order(mike, [orderLine(carwash.smallCarWash.id, [addOnOrder(carwash.wax.id)], tomorrow, carwash.nineToOne, [])]);
		const response = await postOrder(theOrder);
		expect(response.status).toBe(400);
		const json = await response.json() as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.customerFormMissing);
	});

	test('tenant has a customer form, and submitted form does not validate', async () => {
		const mike = customer('Mike', 'Hogan', 'mike@email.com', {});
		const theOrder = order(mike, [orderLine(carwash.smallCarWash.id, [addOnOrder(carwash.wax.id)], tomorrow, carwash.nineToOne, [])]);
		const response = await postOrder(theOrder);
		expect(response.status).toBe(400);
		const json = await response.json() as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.customerFormInvalid);
		expect(json.errorMessage).toBeDefined();
	});

	test('service has a service form, and the service does not have a form response', async () => {
		const mike = customer('Mike', 'Hogan', 'mike@email.com', {
			phone: '23678482376',
			firstLineOfAddress: '1 Main Street',
			'postcode': 'SW1'
		});
		const theOrder = order(mike, [orderLine(carwash.smallCarWash.id, [addOnOrder(carwash.wax.id)], tomorrow, carwash.nineToOne, [])]);
		const response = await postOrder(theOrder);
		expect(response.status).toBe(400);
		const json = await response.json() as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.serviceFormMissing);
		expect(json.errorMessage).toBeDefined();
	});

	test('service has a service form, and the service form is invalid', async () => {
		const mike = customer('Mike', 'Hogan', 'mike@email.com', {
			phone: '23678482376',
			firstLineOfAddress: '1 Main Street',
			'postcode': 'SW1'
		});
		const theOrder = order(mike, [orderLine(carwash.smallCarWash.id, [addOnOrder(carwash.wax.id)], tomorrow, carwash.nineToOne, [{}])]);
		const response = await postOrder(theOrder);
		expect(response.status).toBe(400);
		const json = await response.json() as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.serviceFormInvalid);
		expect(json.errorMessage).toBeDefined();
	});

	test('can add an order for two car washes, each with different add-ons', async () => {
		const mike = customer('Mike', 'Hogan', 'mike@email.com', {
			phone: '23678482376',
			firstLineOfAddress: '1 Main Street',
			'postcode': 'SW1'
		});
		const twoServices = order(mike, [orderLine(carwash.smallCarWash.id, [addOnOrder(carwash.wax.id)], tomorrow, carwash.nineToOne, [{
			make: 'Ford',
			model: 'Focus',
			colour: 'Black',
			year: 2021
		}]), orderLine(carwash.mediumCarWash.id, [addOnOrder(carwash.wax.id), addOnOrder(carwash.polish.id)], dayAfterTomorrow, carwash.nineToOne, [{
			make: 'Honda',
			model: 'Accord',
			colour: 'Silver',
			year: 2022
		}])]);

		const fetched = await postOrder(twoServices);
		if (!fetched.ok) {
			console.error(await fetched.text());
			throw new Error(`Failed to add order`);
		}
		const json = await fetched.json() as OrderCreatedResponse;
		expect(json.orderId).toBeDefined();
		expect(json.customerId).toBeDefined();
		expect(json.bookingIds.length).toBe(2);
		expect(json.orderLineIds.length).toBe(2);
	});

	test('error message when no availability', async () => {
		const mike = customer('Mike', 'Hogan', 'mike@email.com', {
			phone: '23678482376',
			firstLineOfAddress: '1 Main Street',
			'postcode': 'SW1'
		});
		const theOrder = order(mike, [orderLine(carwash.smallCarWash.id, [addOnOrder(carwash.wax.id)], tomorrow, carwash.fourToSix, [{
			make: 'Ford',
			model: 'Focus',
			colour: 'Black',
			year: 2021
		}])]);

		const response1 = await postOrder(theOrder);
		expect(response1.status).toBe(200);

		const response2 = await postOrder(theOrder);
		expect(response2.status).toBe(200);

		const response3 = await postOrder(theOrder);

		expect(response3.status).toBe(400);
		const json = await response3.json() as ErrorResponse;
		expect(json.errorCode).toBe(addOrderErrorCodes.noAvailability);
		expect(json.errorMessage).toBeDefined();
	});
});
