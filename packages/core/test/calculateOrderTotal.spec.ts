import { expect, test } from 'vitest';
import {
	addOnOrder,
	carwash,
	coupon,
	currency,
	customer,
	order,
	orderFns,
	orderLine,
	percentageAsRatio,
	percentageCoupon,
	price,
	priceFns,
	unlimited
} from '../src/index.js';
import { calculateOrderTotal } from '../src/index.js';
import {couponCode} from "@breezbook/packages-types";
import { isoDate, isoDateFns, timezones } from '@breezbook/packages-date-time';

const mike = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671");
const twentyPercentOff = coupon(
	couponCode('20-percent-off'),
	unlimited(),
	percentageCoupon(percentageAsRatio(0.2)),
	isoDate('2021-05-23'),
	isoDate('2021-05-26')
);
const coupons = [twentyPercentOff];
const today = isoDateFns.today(timezones.utc);

test('total of empty order should be zero', () => {
	const theOrder = order(mike, []);
	const total = calculateOrderTotal(theOrder, carwash.addOns, coupons);
	expect(total.orderTotal).toEqual(price(0, currency('N/A')));
});

test('total of order with one line should be the price of the service', () => {
		const theOrder = order(mike, [orderLine(carwash.smallCarWash.id, carwash.locations.london,carwash.smallCarWash.price, [], today, carwash.nineToOne, [])]);
	const total = calculateOrderTotal(theOrder, carwash.addOns, coupons);
	expect(total.orderTotal).toEqual(carwash.smallCarWash.price);
});

test('total of order with one line and one add on should be the price of the service plus the price of the add on', () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id,carwash.locations.london, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id, 1)], today, carwash.nineToOne, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.addOns, coupons);
	expect(total.orderTotal).toEqual(priceFns.add(carwash.smallCarWash.price, carwash.wax.price));
});

test('total of order with one line and two add ons should be the price of the service plus the price of the add ons', () => {
	const theOrder = order(mike, [
		orderLine(
			carwash.smallCarWash.id,
			carwash.locations.london,
			carwash.smallCarWash.price,
			[addOnOrder(carwash.wax.id, 1), addOnOrder(carwash.polish.id, 1)],
			today,
			carwash.nineToOne,
			[]
		)
	]);
	const total = calculateOrderTotal(theOrder, carwash.addOns, coupons);
	expect(total.orderTotal).toEqual(priceFns.add(carwash.smallCarWash.price, priceFns.add(carwash.wax.price, carwash.polish.price)));
});

test('total of order with two lines should be the sum of the prices of the services', () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id, carwash.locations.london,carwash.smallCarWash.price, [], today, carwash.nineToOne, []),
		orderLine(carwash.mediumCarWash.id, carwash.locations.london,carwash.mediumCarWash.price, [], today, carwash.oneToFour, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.addOns, coupons);
	expect(total.orderTotal).toEqual(priceFns.add(carwash.smallCarWash.price, carwash.mediumCarWash.price));
});

test('total of order with two lines and one add on should be the sum of the prices of the services plus the price of the add on', () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id,carwash.locations.london, carwash.smallCarWash.price, [], today, carwash.nineToOne, []),
		orderLine(carwash.mediumCarWash.id,carwash.locations.london, carwash.mediumCarWash.price, [addOnOrder(carwash.wax.id, 1)], today, carwash.oneToFour, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.addOns, coupons);
	expect(total.orderTotal).toEqual(priceFns.add(carwash.smallCarWash.price, priceFns.add(carwash.mediumCarWash.price, carwash.wax.price)));
});

test('total of order with two lines and two add ons should be the sum of the prices of the services plus the price of the add ons', () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id,carwash.locations.london, carwash.smallCarWash.price, [], today, carwash.nineToOne, []),
		orderLine(
			carwash.mediumCarWash.id,
			carwash.locations.london,
			carwash.mediumCarWash.price,
			[addOnOrder(carwash.wax.id, 1), addOnOrder(carwash.polish.id, 1)],
			today,
			carwash.oneToFour,
			[]
		)
	]);
	const total = calculateOrderTotal(theOrder, carwash.addOns, coupons);
	expect(total.orderTotal).toEqual(
		priceFns.add(carwash.smallCarWash.price, priceFns.add(carwash.mediumCarWash.price, priceFns.add(carwash.wax.price, carwash.polish.price)))
	);
});

test('total of order with one line and two add ons with quantities should be the price of the service plus the price of the add ons', () => {
	const theOrder = order(mike, [
		orderLine(
			carwash.smallCarWash.id,
			carwash.locations.london,
			carwash.smallCarWash.price,
			[addOnOrder(carwash.wax.id, 2), addOnOrder(carwash.polish.id, 3)],
			today,
			carwash.nineToOne,
			[]
		)
	]);
	const total = calculateOrderTotal(theOrder, carwash.addOns, coupons);
	expect(total.orderTotal).toEqual(
		priceFns.add(carwash.smallCarWash.price, priceFns.add(priceFns.multiply(carwash.wax.price, 2), priceFns.multiply(carwash.polish.price, 3)))
	);
});

test('coupon can be applied to order', () => {
	const theOrder = orderFns.addCoupon(
		order(mike, [orderLine(carwash.smallCarWash.id,carwash.locations.london, carwash.smallCarWash.price, [], today, carwash.nineToOne, [])]),
		twentyPercentOff.code
	);
	const total = calculateOrderTotal(theOrder, carwash.addOns, coupons);
	expect(total.orderTotal).toEqual(priceFns.multiply(carwash.smallCarWash.price, 0.8));
	expect(total.couponDiscount).toEqual(priceFns.multiply(carwash.smallCarWash.price, 0.2));
});

test('supplied service price is used instead of the price from the service to support dynamic pricing', () => {
	const theOrder = order(mike, [
		orderLine(carwash.smallCarWash.id,carwash.locations.london, price(100, currency('GBP')), [], today, carwash.nineToOne, []),
		orderLine(carwash.mediumCarWash.id,carwash.locations.london, price(200, currency('GBP')), [], today, carwash.oneToFour, [])
	]);
	const total = calculateOrderTotal(theOrder, carwash.addOns, coupons);
	expect(total.orderTotal).toEqual(price(300, currency('GBP')));
});
