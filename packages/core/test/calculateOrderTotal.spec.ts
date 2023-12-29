import { expect, test } from 'vitest';
import { addOnOrder, carwash, currency, customer, isoDate, order, orderLine, price, priceFns } from '../src/index.js';
import { calculateOrderTotal } from '../src/calculateOrderTotal.js';


const mike = customer('Mike', 'Hogan', 'mike@email.com');

test('total of empty order should be zero', () => {
	const theOrder = order(mike, []);
	const total = calculateOrderTotal(theOrder, carwash.services, carwash.addOns);
	expect(total.orderTotal).toEqual(price(0, currency('N/A')));
});

test("total of order with one line should be the price of the service", () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id, [], isoDate(), carwash.nineToOne, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.services, carwash.addOns);
	expect(total.orderTotal).toEqual(carwash.smallCarWash.price);
})

test("total of order with one line and one add on should be the price of the service plus the price of the add on", () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id, [addOnOrder(carwash.wax.id, 1)], isoDate(), carwash.nineToOne, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.services, carwash.addOns);
	expect(total.orderTotal).toEqual(priceFns.add(carwash.smallCarWash.price, carwash.wax.price));
})

test("total of order with one line and two add ons should be the price of the service plus the price of the add ons", () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id, [addOnOrder(carwash.wax.id, 1), addOnOrder(carwash.polish.id, 1)], isoDate(), carwash.nineToOne, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.services, carwash.addOns);
	expect(total.orderTotal).toEqual(priceFns.add(carwash.smallCarWash.price, priceFns.add(carwash.wax.price, carwash.polish.price)));
})

test("total of order with two lines should be the sum of the prices of the services", () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id, [], isoDate(), carwash.nineToOne, []),
		orderLine(carwash.mediumCarWash.id, [], isoDate(), carwash.oneToFour, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.services, carwash.addOns);
	expect(total.orderTotal).toEqual(priceFns.add(carwash.smallCarWash.price, carwash.mediumCarWash.price));
})

test("total of order with two lines and one add on should be the sum of the prices of the services plus the price of the add on", () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id, [], isoDate(), carwash.nineToOne, []),
		orderLine(carwash.mediumCarWash.id, [addOnOrder(carwash.wax.id, 1)], isoDate(), carwash.oneToFour, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.services, carwash.addOns);
	expect(total.orderTotal).toEqual(priceFns.add(carwash.smallCarWash.price, priceFns.add(carwash.mediumCarWash.price, carwash.wax.price)));
})

test("total of order with two lines and two add ons should be the sum of the prices of the services plus the price of the add ons", () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id, [], isoDate(), carwash.nineToOne, []),
		orderLine(carwash.mediumCarWash.id, [addOnOrder(carwash.wax.id, 1), addOnOrder(carwash.polish.id, 1)], isoDate(), carwash.oneToFour, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.services, carwash.addOns);
	expect(total.orderTotal).toEqual(priceFns.add(carwash.smallCarWash.price, priceFns.add(carwash.mediumCarWash.price, priceFns.add(carwash.wax.price, carwash.polish.price))));
})

test("total of order with one line and two add ons with quantities should be the price of the service plus the price of the add ons", () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id, [addOnOrder(carwash.wax.id, 2), addOnOrder(carwash.polish.id, 3)], isoDate(), carwash.nineToOne, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.services, carwash.addOns);
	expect(total.orderTotal).toEqual(priceFns.add(carwash.smallCarWash.price, priceFns.add(priceFns.multiply(carwash.wax.price, 2), priceFns.multiply(carwash.polish.price, 3))));
})