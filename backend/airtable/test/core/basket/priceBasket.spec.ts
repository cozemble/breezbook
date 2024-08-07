import {expect, test} from 'vitest';
import {ErrorResponse, PricedBasket, unpricedBasket, unpricedBasketLine} from '@breezbook/backend-api-types';
import {everythingForCarWashTenantWithDynamicPricing} from '../../helper.js';
import {priceBasket, pricingErrorCodes} from '../../../src/core/basket/priceBasket.js';
import {
    addOnOrder,
    carwash,
    currencies,
    price,
    priceFns, serviceOption
} from '@breezbook/packages-core';
import {addOrderErrorCodes} from '../../../src/express/onAddOrderExpress.js';
import {
    couponCode,
    mandatory,
    serviceOptionRequest
} from '@breezbook/packages-types';
import { duration, isoDateFns, timePeriodFns, timezones, minutes } from '@breezbook/packages-date-time';

const today = isoDateFns.today(timezones.utc);
const dayBeyondDynamicPricing = isoDateFns.addDays(today, 10);

test('can price an empty basket', () => {
    const emptyBasket = unpricedBasket([]);
    const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([]), emptyBasket) as PricedBasket;
    expect(result._type).toBe('priced.basket');
    expect(result.lines).toHaveLength(0);
    expect(result.total).toEqual(price(0, currencies.NULL));
});

test('can price a basket with one line item', () => {
    const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, carwash.locations.london, [], dayBeyondDynamicPricing, carwash.nineToOne.slot.from, timePeriodFns.duration(carwash.nineToOne.slot),[])]);
    const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as PricedBasket;
    expect(result.total).toEqual(carwash.smallCarWash.price);
    expect(result.lines).toHaveLength(1);
    expect(result.lines?.[0]?.priceBreakdown?.total).toEqual(carwash.smallCarWash.price.amount.value);
    expect(result.lines?.[0]?.priceBreakdown?.servicePrice).toEqual(carwash.smallCarWash.price.amount.value);
});

test('uses dynamic pricing if applicable', () => {
    const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, carwash.locations.london, [], today, carwash.nineToOne.slot.from, [])]);
    const result = priceBasket(everythingForCarWashTenantWithDynamicPricing(), basket) as PricedBasket;
    expect(result.total).toEqual(priceFns.multiply(carwash.smallCarWash.price, 1.4));
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]?.priceBreakdown?.total).toEqual(priceFns.multiply(carwash.smallCarWash.price, 1.4).amount.value);
});

test('can price a basket with multiple line items', () => {
    const basket = unpricedBasket([
        unpricedBasketLine(carwash.smallCarWash.id, carwash.locations.london, [], dayBeyondDynamicPricing, carwash.nineToOne.slot.from, []),
        unpricedBasketLine(carwash.smallCarWash.id, carwash.locations.london, [], dayBeyondDynamicPricing, carwash.nineToOne.slot.from, [])
    ]);
    const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as PricedBasket;
    expect(result.total).toEqual(priceFns.multiply(carwash.smallCarWash.price, 2));
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].priceBreakdown.total).toEqual(carwash.smallCarWash.price.amount.value);
    expect(result.lines[1].priceBreakdown.total).toEqual(carwash.smallCarWash.price.amount.value);
});

test('can price a basket with a coupon code', () => {
    const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, carwash.locations.london, [], dayBeyondDynamicPricing, carwash.nineToOne.slot.from, [])], couponCode('20-percent-off'));
    const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as PricedBasket;
    expect(result.total).toEqual(priceFns.multiply(carwash.smallCarWash.price, 0.8));
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].priceBreakdown.total).toEqual(carwash.smallCarWash.price.amount.value);
    expect(result.discount).toEqual(priceFns.multiply(carwash.smallCarWash.price, 0.2));
});

test('adds the cost of add-ons to the line total and the main total', () => {
    const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, carwash.locations.london, [addOnOrder(carwash.wax.id)], dayBeyondDynamicPricing, carwash.nineToOne.slot.from, [])]);
    const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as PricedBasket;
    expect(result.total).toEqual(priceFns.add(carwash.smallCarWash.price, carwash.wax.price));
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].priceBreakdown.total).toEqual(priceFns.add(carwash.smallCarWash.price, carwash.wax.price).amount.value);
});

test('issues a good error message if the coupon code is expired', () => {
    const basket = unpricedBasket(
        [unpricedBasketLine(carwash.smallCarWash.id, carwash.locations.london, [], dayBeyondDynamicPricing, carwash.nineToOne.slot.from, [])],
        couponCode('expired-20-percent-off')
    );
    const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as ErrorResponse;
    expect(result._type).toBe('error.response');
    expect(result.errorCode).toBe(addOrderErrorCodes.expiredCoupon);
});

test('issues a good error message if the coupon code is not found', () => {
    const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, carwash.locations.london, [], dayBeyondDynamicPricing, carwash.nineToOne.slot.from, [])], couponCode('no-such-coupon'));
    const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as ErrorResponse;
    expect(result._type).toBe('error.response');
    expect(result.errorCode).toBe(addOrderErrorCodes.noSuchCoupon);
});

test('can deal with no availability on the day', () => {
    const basket = unpricedBasket([unpricedBasketLine(carwash.smallCarWash.id, carwash.locations.london, [], today, carwash.nineToOne.slot.from, [])]);
    const result = priceBasket(everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing), basket) as ErrorResponse;
    expect(result._type).toBe('error.response');
    expect(result.errorCode).toBe(pricingErrorCodes.pricingError);
});

test("adds the cost of service options to the line total", () => {
    const aServiceOption = serviceOption(price(1000, currencies.GBP), false, duration(minutes(10)), [], [])
    const basket = unpricedBasket([
        unpricedBasketLine(
            carwash.smallCarWash.id,
            carwash.locations.london,
            [],
            dayBeyondDynamicPricing,
            carwash.nineToOne.slot.from,
            timePeriodFns.duration(carwash.nineToOne.slot),
            [],
            [],
            [serviceOptionRequest(aServiceOption.id, 2)])]);
    let everythingForTenant = everythingForCarWashTenantWithDynamicPricing([], dayBeyondDynamicPricing);
    everythingForTenant = {
        ...everythingForTenant,
        businessConfiguration: {...everythingForTenant.businessConfiguration, serviceOptions: [aServiceOption]}
    };
    const result = priceBasket(everythingForTenant, basket) as PricedBasket;
    expect(result.total).toEqual(priceFns.add(carwash.smallCarWash.price, aServiceOption.price, aServiceOption.price));
    expect(result.lines).toHaveLength(1);
    const firstLine = mandatory(result.lines[0], 'Missing first line');
    expect(firstLine.priceBreakdown.total).toEqual(priceFns.add(carwash.smallCarWash.price, aServiceOption.price, aServiceOption.price).amount.value);
});