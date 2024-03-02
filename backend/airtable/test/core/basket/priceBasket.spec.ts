import { expect, test } from 'vitest';
import { ErrorResponse, PricedBasket, unpricedBasket, unpricedBasketLine } from '@breezbook/backend-api-types';
import { everythingForCarWashTenantWithDynamicPricing } from '../../helper.js';
import { priceBasket, pricingErrorCodes } from '../../../src/core/basket/priceBasket.js';
import { addOnOrder, carwash, couponCode, currencies, isoDate, isoDateFns, price, priceFns } from '@breezbook/packages-core';
import { addOrderErrorCodes } from '../../../src/express/addOrder.js';

const today = isoDate();
const dayBeyondDynamicPricing = isoDateFns.addDays(today, 10);

test('can price an empty basket', () => {
	const emptyBasket = unpricedBasket([]);
	const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([]), emptyBasket) as PricedBasket;
	expect(result._type).toBe('priced.basket');
	expect(result.lines).toHaveLength(0);
	expect(result.total).toEqual(price(0, currencies.NULL));
});

test('can price a basket with one line item', () => {
	const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, [], dayBeyondDynamicPricing, carwash.nineToOne)]);
	const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as PricedBasket;
	expect(result.total).toEqual(carwash.smallCarWash.price);
	expect(result.lines).toHaveLength(1);
	expect(result.lines[0].total).toEqual(carwash.smallCarWash.price);
	expect(result.lines[0].servicePrice).toEqual(carwash.smallCarWash.price);
});

test('uses dynamic pricing if applicable', () => {
	const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, [], today, carwash.nineToOne)]);
	const result = priceBasket(everythingForCarWashTenantWithDynamicPricing(), basket) as PricedBasket;
	expect(result.total).toEqual(priceFns.multiply(carwash.smallCarWash.price, 1.4));
	expect(result.lines).toHaveLength(1);
	expect(result.lines[0].total).toEqual(priceFns.multiply(carwash.smallCarWash.price, 1.4));
});

test('can price a basket with multiple line items', () => {
	const basket = unpricedBasket([
		unpricedBasketLine(carwash.smallCarWash.id, [], dayBeyondDynamicPricing, carwash.nineToOne),
		unpricedBasketLine(carwash.smallCarWash.id, [], dayBeyondDynamicPricing, carwash.nineToOne)
	]);
	const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as PricedBasket;
	expect(result.total).toEqual(priceFns.multiply(carwash.smallCarWash.price, 2));
	expect(result.lines).toHaveLength(2);
	expect(result.lines[0].total).toEqual(carwash.smallCarWash.price);
	expect(result.lines[1].total).toEqual(carwash.smallCarWash.price);
});

test('can price a basket with a coupon code', () => {
	const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, [], dayBeyondDynamicPricing, carwash.nineToOne)], couponCode('20-percent-off'));
	const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as PricedBasket;
	expect(result.total).toEqual(priceFns.multiply(carwash.smallCarWash.price, 0.8));
	expect(result.lines).toHaveLength(1);
	expect(result.lines[0].total).toEqual(carwash.smallCarWash.price);
	expect(result.discount).toEqual(priceFns.multiply(carwash.smallCarWash.price, 0.2));
});

test('adds the cost of add-ons to the line total and the main total', () => {
	const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, [addOnOrder(carwash.wax.id)], dayBeyondDynamicPricing, carwash.nineToOne)]);
	const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as PricedBasket;
	expect(result.total).toEqual(priceFns.add(carwash.smallCarWash.price, carwash.wax.price));
	expect(result.lines).toHaveLength(1);
	expect(result.lines[0].total).toEqual(priceFns.add(carwash.smallCarWash.price, carwash.wax.price));
});

test('issues a good error message if the coupon code is expired', () => {
	const basket = unpricedBasket(
		[unpricedBasketLine(carwash.smallCarWash.id, [], dayBeyondDynamicPricing, carwash.nineToOne)],
		couponCode('expired-20-percent-off')
	);
	const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as ErrorResponse;
	expect(result._type).toBe('error.response');
	expect(result.errorCode).toBe(addOrderErrorCodes.expiredCoupon);
});

test('issues a good error message if the coupon code is not found', () => {
	const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, [], dayBeyondDynamicPricing, carwash.nineToOne)], couponCode('no-such-coupon'));
	const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as ErrorResponse;
	expect(result._type).toBe('error.response');
	expect(result.errorCode).toBe(addOrderErrorCodes.noSuchCoupon);
});

test('can deal with no availability on the day', () => {
	const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, [], today, carwash.nineToOne)]);
	const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as ErrorResponse;
	expect(result._type).toBe('error.response');
	expect(result.errorCode).toBe(pricingErrorCodes.pricingError);
});
