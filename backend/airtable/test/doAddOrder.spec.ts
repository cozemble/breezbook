import {expect, test} from 'vitest';
import {
    booking,
    carwash,
    Coupon,
    couponCode,
    currency,
    Customer,
    customer,
    customerId,
    fullPaymentOnCheckout,
    IsoDate,
    isoDate,
    isoDateFns,
    LocationId,
    Price,
    price,
    priceFns,
    Service,
    TwentyFourHourClockTime
} from '@breezbook/packages-core';
import {
    everythingForCarWashTenantWithDynamicPricing,
    fiveDaysFromNow,
    fourDaysFromNow,
    goodCustomer,
    goodServiceFormData,
    today
} from './helper.js';
import {ErrorResponse} from '@breezbook/backend-api-types';
import {
    addOrderErrorCodes,
    doAddOrder,
    EverythingToCreateOrder,
    everythingToCreateOrder,
    hydratedBasket,
    hydratedBasketLine
} from '../src/express/onAddOrderExpress.js';

const london = carwash.locations.london;
const smallCarWash = carwash.smallCarWash;

function orderForService(service: Service, location: LocationId, startTime: TwentyFourHourClockTime): EverythingToCreateOrder {
    const basket = hydratedBasket([
        hydratedBasketLine(service, location, [], service.price, service.price, today, startTime, [goodServiceFormData])
    ])
    return everythingToCreateOrder(basket, goodCustomer, fullPaymentOnCheckout())
}

function setCustomer(order: EverythingToCreateOrder, customer: Customer): EverythingToCreateOrder {
    return {...order, customer: customer};
}

function setServiceForm(order: EverythingToCreateOrder, serviceForm: unknown[], lineId = 0): EverythingToCreateOrder {
    return {
        ...order,
        basket: {
            ...order.basket,
            lines: order.basket.lines.map((line, index) => index === lineId ? {
                ...line,
                serviceFormData: serviceForm
            } : line)
        }
    };
}

test('tenant has a customer form, and the customer does not have a form response', () => {
    const theCustomer = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671");
    const order = setCustomer(orderForService(smallCarWash, london, carwash.nineToOne.slot.from), theCustomer);

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.customerFormMissing);
});

test('tenant has a customer form, and submitted form does not validate', () => {
    const mike = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671", {});
    const order = setCustomer(orderForService(smallCarWash, london, carwash.nineToOne.slot.from), mike);

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.customerFormInvalid);
    expect(outcome.errorMessage).toBeDefined();
});

test('service has a service form, and the service does not have a form response', () => {
    const order = setServiceForm(orderForService(smallCarWash, london, carwash.nineToOne.slot.from), []);
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.serviceFormMissing);
    expect(outcome.errorMessage).toBeDefined();
});

test('service has a service form, and the service form is invalid', () => {
    const order = setServiceForm(orderForService(smallCarWash, london, carwash.nineToOne.slot.from), [{}]);
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.serviceFormInvalid);
    expect(outcome.errorMessage).toBeDefined();
});

function setBasketTotal(order: EverythingToCreateOrder, price1: Price) {
    return {...order, basket: {...order.basket, total: price1}};
}

test('error message when posted price is not the same as the server side calculated price', () => {
    const order = setBasketTotal(orderForService(smallCarWash, london, carwash.nineToOne.slot.from), price(100, currency('GBP')));
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.wrongTotalPrice);
    expect(outcome.errorMessage).toBeDefined();
});

test('error message when no availability', () => {
    const booking1 = booking(customerId('customer#1'), carwash.smallCarWash, today, carwash.nineToOne.slot);
    const booking2 = booking(customerId('customer#1'), carwash.smallCarWash, today, carwash.nineToOne.slot);

    const order = orderForService(smallCarWash, london, carwash.nineToOne.slot.from);
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([booking1, booking2]), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.noAvailability);
    expect(outcome.errorMessage).toBeDefined();
});

function setCoupon(order: EverythingToCreateOrder, coupon: Coupon): EverythingToCreateOrder {
    return {...order, basket: {...order.basket, coupon: coupon}};
}

test('an order with an non-existent coupon code should fail with an error code', () => {
    const order = setCoupon(orderForService(smallCarWash, london, carwash.nineToOne.slot.from), ({
        ...carwash.coupons.twentyPercentOffCoupon,
        code: couponCode('this does not exist')
    }));
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.noSuchCoupon);
    expect(outcome.errorMessage).toBeDefined();
});

test('an order with an expired coupon should fail with an error code', () => {
    const order = setCoupon(orderForService(smallCarWash, london, carwash.nineToOne.slot.from), carwash.coupons.expired20PercentOffCoupon);
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.expiredCoupon);
    expect(outcome.errorMessage).toBeDefined();
});

function adjustServiceToDynamicPricingForToday(service: Service) {
    const pricedAdjustedByDynamicPricing = priceFns.multiply(service.price, 1.4)
    return {...service, price: pricedAdjustedByDynamicPricing};
}

test('an order intending full payment on checkout should reserve the booking', () => {
    const smallCarwashWithAdjustedPrice = adjustServiceToDynamicPricingForToday(carwash.smallCarWash);
    const order = orderForService(smallCarwashWithAdjustedPrice, london, carwash.nineToOne.slot.from);
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), order);
    if (!outcome || outcome._type !== 'success') {
        throw new Error('Expected success, got ' + JSON.stringify(outcome));
    }
    expect(outcome.mutations.mutations.some((m) => m._type === 'create' && m.entity === 'reservations')).toBeDefined();
});

test('the event log for the order creation should be stored', () => {
    const smallCarwashWithAdjustedPrice = adjustServiceToDynamicPricingForToday(carwash.smallCarWash);
    const order = orderForService(smallCarwashWithAdjustedPrice, london, carwash.nineToOne.slot.from);
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing(), order);
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
    const basket = hydratedBasket(
        [hydratedBasketLine(smallCarWash, london, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fourDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData])],
        carwash.coupons.twentyPercentOffCoupon,
        price(10000000000, currency('GBP')),
        priceFns.multiply(carwash.smallCarWash.price, 0.8)
    );
    const order = everythingToCreateOrder(basket, goodCustomer, fullPaymentOnCheckout())

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fourDaysFromNow), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.incorrectDiscountAmount);
    expect(outcome.errorMessage).toBeDefined();
});

test('an order with a coupon code should apply the discount', () => {
    const basket = hydratedBasket(
        [hydratedBasketLine(smallCarWash, london, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fourDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData])],
        carwash.coupons.twentyPercentOffCoupon,
        priceFns.multiply(carwash.smallCarWash.price, 0.2),
        priceFns.multiply(carwash.smallCarWash.price, 0.8)
    );
    const order = everythingToCreateOrder(basket, goodCustomer, fullPaymentOnCheckout())

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fourDaysFromNow), order);
    if (!outcome || outcome._type !== 'success') {
        throw new Error('Expected success, got ' + JSON.stringify(outcome));
    }
    expect(outcome.orderCreatedResponse.bookingIds).toHaveLength(1);
});

function setDate(order: EverythingToCreateOrder, date: IsoDate): EverythingToCreateOrder {
    return {...order, basket: {...order.basket, lines: order.basket.lines.map((line) => ({...line, date}))}};
}

test('the customer and service forms should be persisted', () => {
    const order = setDate(orderForService(smallCarWash, london, carwash.nineToOne.slot.from), fourDaysFromNow)
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fourDaysFromNow), order);
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
    const basket = hydratedBasket(
        [
            hydratedBasketLine(smallCarWash, london, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fiveDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData]),
            hydratedBasketLine(smallCarWash, london, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fiveDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData])
        ],
    );
    const order = everythingToCreateOrder(basket, goodCustomer, fullPaymentOnCheckout())
    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fiveDaysFromNow), order);
    if (!outcome || outcome._type !== 'success') {
        throw new Error('Expected success, got ' + JSON.stringify(outcome));
    }
});

test("can handle a basket with more than one line on different days", () => {
    const basket = hydratedBasket(
        [
            hydratedBasketLine(smallCarWash, london, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fiveDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData]),
            hydratedBasketLine(smallCarWash, london, [], carwash.smallCarWash.price, carwash.smallCarWash.price, fourDaysFromNow, carwash.nineToOne.slot.from, [goodServiceFormData])
        ],
    );
    const order = everythingToCreateOrder(basket, goodCustomer, fullPaymentOnCheckout())

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], fiveDaysFromNow, [fourDaysFromNow]), order);
    if (!outcome || outcome._type !== 'success') {
        throw new Error('Expected success, got ' + JSON.stringify(outcome));
    }
});

test("not possible to make an order in the past", () => {
    const dayInThePast = isoDateFns.addDays(isoDate(), -1);
    const order = setDate(orderForService(smallCarWash, london, carwash.nineToOne.slot.from), dayInThePast);

    const outcome = doAddOrder(everythingForCarWashTenantWithDynamicPricing([], dayInThePast), order) as ErrorResponse;
    expect(outcome.errorCode).toBe(addOrderErrorCodes.serviceDateInThePast);
    expect(outcome.errorMessage).toBeDefined();
})