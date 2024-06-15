import {expect, test} from 'vitest';
import {
    booking,
    carwash,
    couponCode,
    currency,
    customer,
    customerId,
    fullPaymentOnCheckout,
    isoDate,
    isoDateFns,
    price,
    priceFns
} from '@breezbook/packages-core';
import {
    everythingForCarWashTenantWithDynamicPricing,
    fiveDaysFromNow,
    fourDaysFromNow,
    goodCustomer,
    goodServiceFormData,
    today
} from './helper.js';
import {ErrorResponse, pricedBasket, pricedBasketLine, pricedCreateOrderRequest} from '@breezbook/backend-api-types';
import {addOrderErrorCodes, doAddOrder} from '../src/express/addOrder.js';

const london = carwash.locations.london;
const smallCarWash = carwash.smallCarWash;

test('tenant has a customer form, and the customer does not have a form response', () => {
    const theCustomer = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671");
    const thePricedBasket = pricedBasket([pricedBasketLine(london, smallCarWash.id, [], smallCarWash.price, smallCarWash.price, today, carwash.nineToOne.slot.from, [])], smallCarWash.price);
    const request = pricedCreateOrderRequest(thePricedBasket, theCustomer, fullPaymentOnCheckout());
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.customerFormMissing);
});

test('tenant has a customer form, and submitted form does not validate', () => {
    const mike = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671", {});
    const thePricedBasket = pricedBasket([pricedBasketLine(london, smallCarWash.id, [], smallCarWash.price, smallCarWash.price, today, carwash.nineToOne.slot.from, [])], smallCarWash.price);
    const request = pricedCreateOrderRequest(thePricedBasket, mike, fullPaymentOnCheckout());

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.customerFormInvalid);
    expect(outcome.errorMessage).toBeDefined();
});

test('service has a service form, and the service does not have a form response', () => {
    const thePricedBasket = pricedBasket([pricedBasketLine(london, smallCarWash.id, [], smallCarWash.price, smallCarWash.price, today, carwash.nineToOne.slot.from, [])], smallCarWash.price);
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.serviceFormMissing);
    expect(outcome.errorMessage).toBeDefined();
});

test('service has a service form, and the service form is invalid', () => {
    const thePricedBasket = pricedBasket([pricedBasketLine(london, smallCarWash.id, [], smallCarWash.price, smallCarWash.price, today, carwash.nineToOne.slot.from, [{}])], smallCarWash.price);
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.serviceFormInvalid);
    expect(outcome.errorMessage).toBeDefined();
});

test('error message when posted price is not the same as the server side calculated price', () => {
    const thePricedBasket = pricedBasket([pricedBasketLine(london, smallCarWash.id, [], smallCarWash.price, price(100, currency('GBP')), today, carwash.nineToOne.slot.from, [goodServiceFormData])], price(100, currency('GBP')));
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.wrongTotalPrice);
    expect(outcome.errorMessage).toBeDefined();
});

test('error message when no availability', () => {
    const booking1 = booking(customerId('customer#1'), carwash.smallCarWash, today, carwash.nineToOne.slot);
    const booking2 = booking(customerId('customer#1'), carwash.smallCarWash, today, carwash.nineToOne.slot);

    const thePricedBasket = pricedBasket([pricedBasketLine(london, smallCarWash.id, [], smallCarWash.price, smallCarWash.price, today, carwash.nineToOne.slot.from, [goodServiceFormData])], smallCarWash.price);
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([booking1, booking2]), request) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.noAvailability);
    expect(outcome.errorMessage).toBeDefined();
});

test('an order with an non-existent coupon code should fail with an error code', () => {
    const thePricedBasket = pricedBasket([pricedBasketLine(london, smallCarWash.id, [], smallCarWash.price, smallCarWash.price, today, carwash.nineToOne.slot.from, [goodServiceFormData])], smallCarWash.price, couponCode('this-does-not-exist'));
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.noSuchCoupon);
    expect(outcome.errorMessage).toBeDefined();
});

test('an order with an expired coupon should fail with an error code', () => {
    const thePricedBasket = pricedBasket([pricedBasketLine(london, smallCarWash.id, [], smallCarWash.price, smallCarWash.price, today, carwash.nineToOne.slot.from, [goodServiceFormData])], smallCarWash.price, couponCode('expired-20-percent-off'));
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.expiredCoupon);
    expect(outcome.errorMessage).toBeDefined();
});

test('an order intending full payment on checkout should reserve the booking', () => {
    const pricedAdjustedByDynamicPricing = price(carwash.smallCarWash.price.amount.value * 1.4, carwash.smallCarWash.price.currency)
    const thePricedBasket = pricedBasket(
        [pricedBasketLine(london, smallCarWash.id, [], pricedAdjustedByDynamicPricing, pricedAdjustedByDynamicPricing, today, carwash.nineToOne.slot.from, [goodServiceFormData])],
        pricedAdjustedByDynamicPricing
    );
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request);
    if (!outcome || outcome._type !== 'success') {
        throw new Error('Expected success, got ' + JSON.stringify(outcome));
    }
    expect(outcome.mutations.mutations.some((m) => m._type === 'create' && m.entity === 'reservations')).toBeDefined();
});

test('the event log for the order creation should be stored', () => {
    const pricedAdjustedByDynamicPricing = price(carwash.smallCarWash.price.amount.value * 1.4, carwash.smallCarWash.price.currency)
    const thePricedBasket = pricedBasket(
        [pricedBasketLine(london, smallCarWash.id, [], pricedAdjustedByDynamicPricing, pricedAdjustedByDynamicPricing, today, carwash.nineToOne.slot.from, [goodServiceFormData])],
        pricedAdjustedByDynamicPricing
    );
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request);
    if (!outcome || outcome._type !== 'success') {
        throw new Error('Expected success, got ' + JSON.stringify(outcome));
    }
    expect(outcome.mutations.mutations.some((m) => m._type === 'create' && m.entity === 'mutation_events')).toBeDefined();
});

// test('an order with a non-existent timeslot by id should result in an error', () => {
//     const timeslot = {...carwash.oneToFour, id: id('this-does-not-exist')};
//     const pricedAdjustedByDynamicPricing = price(carwash.smallCarWash.price.amount.value * 1.4, carwash.smallCarWash.price.currency)
//     const thePricedBasket = pricedBasket(
//         [pricedBasketLine(london, smallCarWash.id, [], pricedAdjustedByDynamicPricing, pricedAdjustedByDynamicPricing, today, timeslot.slot.from, [goodServiceFormData])],
//         pricedAdjustedByDynamicPricing
//     );
//     const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());
//
//     const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), request) as ErrorResponse;
//     expect(outcome.errorCode).toBe(addOrderErrorCodes.noSuchTimeslotId);
//     expect(outcome.errorMessage).toBeDefined();
// });

test('an order with a coupon must correctly state the discount', () => {
    const thePricedBasket = pricedBasket(
        [pricedBasketLine(london, smallCarWash.id, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fourDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData])],
        priceFns.multiply(carwash.smallCarWash.price, 0.8),
        couponCode('20-percent-off'),
        price(10000000000, currency('GBP'))
    );
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fourDaysFromNow), request) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.incorrectDiscountAmount);
    expect(outcome.errorMessage).toBeDefined();
});

test('an order with a coupon code should apply the discount', () => {
    const thePricedBasket = pricedBasket(
        [pricedBasketLine(london, smallCarWash.id, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fourDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData])],
        priceFns.multiply(carwash.smallCarWash.price, 0.8),
        couponCode('20-percent-off'),
        priceFns.multiply(carwash.smallCarWash.price, 0.2)
    );
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fourDaysFromNow), request);
    if (!outcome || outcome._type !== 'success') {
        throw new Error('Expected success, got ' + JSON.stringify(outcome));
    }
    expect(outcome.orderCreatedResponse.bookingIds).toHaveLength(1);
});

test('the customer and service forms should be persisted', () => {
    const thePricedBasket = pricedBasket(
        [pricedBasketLine(london, smallCarWash.id, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fourDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData])],
        carwash.smallCarWash.price,
    );
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());

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

test("can handle a basket with more than one line", () => {
    const thePricedBasket = pricedBasket(
        [
            pricedBasketLine(london, smallCarWash.id, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fiveDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData]),
            pricedBasketLine(london, smallCarWash.id, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fiveDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData])
        ],
        priceFns.multiply(carwash.smallCarWash.price, 2),
    );
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fiveDaysFromNow), request);
    if (!outcome || outcome._type !== 'success') {
        throw new Error('Expected success, got ' + JSON.stringify(outcome));
    }
});

test("can handle a basket with more than one line on different days", () => {
    const thePricedBasket = pricedBasket(
        [
            pricedBasketLine(london, smallCarWash.id, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fiveDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData]),
            pricedBasketLine(london, smallCarWash.id, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fourDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData])
        ],
        priceFns.multiply(carwash.smallCarWash.price, 2),
    );
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fiveDaysFromNow, [fourDaysFromNow]), request);
    if (!outcome || outcome._type !== 'success') {
        throw new Error('Expected success, got ' + JSON.stringify(outcome));
    }
});

test("not possible to make an order in the past", () => {
    const dayInThePast = isoDateFns.addDays(isoDate(), -1);
    const thePricedBasket = pricedBasket(
        [pricedBasketLine(london, smallCarWash.id, [], carwash.smallCarWash.price, carwash.smallCarWash.price, dayInThePast, carwash.nineToOne.slot.from, [goodServiceFormData])],
        carwash.smallCarWash.price,
    );
    const request = pricedCreateOrderRequest(thePricedBasket, goodCustomer, fullPaymentOnCheckout());

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], dayInThePast), request) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.serviceDateInThePast);
    expect(outcome.errorMessage).toBeDefined();
})
