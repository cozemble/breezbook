import {describe, expect, test} from 'vitest';
import {
    booking,
    currencies,
    customerId,
    fixedClock,
    percentageAsRatio,
    price,
    service,
} from '../src/index.js';
import {findRefundRule, hours, refundPolicy, timebasedRefundRule} from '../src/cancellation.js';
import {isoDate, minutes, serviceId, time24, timePeriod} from "@breezbook/packages-types";

describe('given a booking from 09:00 to 13:00 in two days time and a four level time based refund policy', () => {
    const theService = service("Test Service", "Test Description", [], minutes(60), price(3500, currencies.GBP), [], [], serviceId('444'));
    const theBooking = booking(customerId('123'), theService, isoDate('2024-01-28'), timePeriod(time24('09:00'), time24('13:00')));
    const fullRefundIfMoreThan24hrs = timebasedRefundRule(hours(24), percentageAsRatio(1));
    const halfRefundIfBetween24hrsAnd6hrs = timebasedRefundRule(hours(6), percentageAsRatio(0.5));
    const quarterRefundIfBetween6hrsAnd1hr = timebasedRefundRule(hours(1), percentageAsRatio(0.25));
    const oneTenthRefundIfOneHourOrLess = timebasedRefundRule(hours(0), percentageAsRatio(0.1));
    const thePolicy = refundPolicy([fullRefundIfMoreThan24hrs, halfRefundIfBetween24hrsAnd6hrs, quarterRefundIfBetween6hrsAnd1hr, oneTenthRefundIfOneHourOrLess]);

    test('A cancellation more than 24hrs prior gets a 100% refund', () => {
        let clock = fixedClock(new Date(2024, 0, 27, 9, 0));
        expect(findRefundRule(theBooking, thePolicy, clock)).toEqual({
            _type: 'refund.possible',
            hoursToBookingStart: hours(24),
            applicableRule: fullRefundIfMoreThan24hrs
        });

        clock = fixedClock(new Date(2024, 0, 27, 8, 0));
        expect(findRefundRule(theBooking, thePolicy, clock)).toEqual({
            _type: 'refund.possible',
            hoursToBookingStart: hours(25),
            applicableRule: fullRefundIfMoreThan24hrs
        });
    });
    test('A cancellation less than 24hrs prior gets a 50% refund', () => {
        let clock = fixedClock(new Date(2024, 0, 27, 10, 0));
        expect(findRefundRule(theBooking, thePolicy, clock)).toEqual({
            _type: 'refund.possible',
            hoursToBookingStart: hours(23),
            applicableRule: halfRefundIfBetween24hrsAnd6hrs
        });
        clock = fixedClock(new Date(2024, 0, 28, 3, 0));
        expect(findRefundRule(theBooking, thePolicy, clock)).toEqual({
            _type: 'refund.possible',
            hoursToBookingStart: hours(6),
            applicableRule: halfRefundIfBetween24hrsAnd6hrs
        });
    });
    test('A cancellation less than 6hrs prior gets a 25% refund', () => {
        let clock = fixedClock(new Date(2024, 0, 28, 4, 0));
        expect(findRefundRule(theBooking, thePolicy, clock)).toEqual({
            _type: 'refund.possible',
            hoursToBookingStart: hours(5),
            applicableRule: quarterRefundIfBetween6hrsAnd1hr
        });
        clock = fixedClock(new Date(2024, 0, 28, 8, 0));
        expect(findRefundRule(theBooking, thePolicy, clock)).toEqual({
            _type: 'refund.possible',
            hoursToBookingStart: hours(1),
            applicableRule: quarterRefundIfBetween6hrsAnd1hr
        });
    });
    test('A cancellation less than 1hr prior gets a 10% refund', () => {
        const clock = fixedClock(new Date(2024, 0, 28, 8, 1));
        expect(findRefundRule(theBooking, thePolicy, clock)).toEqual({
            _type: 'refund.possible',
            hoursToBookingStart: hours(0),
            applicableRule: oneTenthRefundIfOneHourOrLess
        });
    });
    test('not possible to cancel a past booking', () => {
        const clock = fixedClock(new Date(2024, 0, 28, 9, 1));
        expect(findRefundRule(theBooking, thePolicy, clock)).toEqual({
            _type: 'booking.is.in.the.past'
        });
    });
    test('returns a good response when no refund rule is found', () => {
        const clock = fixedClock(new Date(2024, 0, 26, 9, 1));
        expect(findRefundRule(theBooking, refundPolicy([]), clock)).toEqual({
            _type: 'no.refund.rule.found'
        });
    });
});
