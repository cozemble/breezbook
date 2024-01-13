import { customer, fullPaymentOnCheckout, isoDate, isoDateFns, Order, Price } from '@breezbook/packages-core';
import { createOrderRequest } from '@breezbook/backend-api-types';

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
