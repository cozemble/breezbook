import { expect, test } from 'vitest';
import { addOnOrder, carwash, customer, isoDate, isoDateFns, order, orderFns, orderLine } from '../src/index.js';

const tomorrow = isoDateFns.addDays(isoDate(), 1);
const dayAfterTomorrow = isoDateFns.addDays(isoDate(), 2);
const mike = customer('Mike', 'Hogan', 'mike@email.com', null);

test('can get from and to date from an order with one order line', () => {
	const theOrder = order(mike, [orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.fourToSix, [])]);
	const { fromDate, toDate } = orderFns.getOrderDateRange(theOrder);
	expect(fromDate).toBe(tomorrow);
	expect(toDate).toBe(tomorrow);
});

test('can get from and to date from an order with two order lines on the same day', () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.fourToSix, []),
		orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.fourToSix, [])
	]);
	const { fromDate, toDate } = orderFns.getOrderDateRange(theOrder);
	expect(fromDate).toBe(tomorrow);
	expect(toDate).toBe(tomorrow);
});

test('can get from and to date from an order with two order lines on different days', () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.fourToSix, []),
		orderLine(carwash.smallCarWash.id, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], dayAfterTomorrow, carwash.fourToSix, [])
	]);
	const { fromDate, toDate } = orderFns.getOrderDateRange(theOrder);
	expect(fromDate).toBe(tomorrow);
	expect(toDate).toBe(dayAfterTomorrow);
});
