import {expect, test} from 'vitest';
import {addOnOrder, carwash, customer,  order, orderFns, orderLine} from '../src/index.js';
import { isoDate, isoDateFns, timezones } from '@breezbook/packages-date-time';

const today = isoDateFns.today(timezones.utc)

const tomorrow = isoDateFns.addDays(today, 1);
const dayAfterTomorrow = isoDateFns.addDays(today, 2);
const mike = customer('Mike', 'Hogan', 'mike@email.com', "+14155552671", null);

test('can get from and to date from an order with one order line', () => {
    const theOrder = order(mike, [orderLine(carwash.smallCarWash.id, carwash.locations.london, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.fourToSix, [])]);
    const {fromDate, toDate} = orderFns.getOrderDateRange(theOrder);
    expect(fromDate).toBe(tomorrow);
    expect(toDate).toBe(tomorrow);
});

test('can get from and to date from an order with two order lines on the same day', () => {
    const theOrder = order(mike, [
        orderLine(carwash.smallCarWash.id, carwash.locations.london, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.fourToSix, []),
        orderLine(carwash.smallCarWash.id, carwash.locations.london, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.fourToSix, [])
    ]);
    const {fromDate, toDate} = orderFns.getOrderDateRange(theOrder);
    expect(fromDate).toBe(tomorrow);
    expect(toDate).toBe(tomorrow);
});

test('can get from and to date from an order with two order lines on different days', () => {
    const theOrder = order(mike, [
        orderLine(carwash.smallCarWash.id, carwash.locations.london, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], tomorrow, carwash.fourToSix, []),
        orderLine(carwash.smallCarWash.id, carwash.locations.london, carwash.smallCarWash.price, [addOnOrder(carwash.wax.id)], dayAfterTomorrow, carwash.fourToSix, [])
    ]);
    const {fromDate, toDate} = orderFns.getOrderDateRange(theOrder);
    expect(fromDate).toBe(tomorrow);
    expect(toDate).toBe(dayAfterTomorrow);
});
