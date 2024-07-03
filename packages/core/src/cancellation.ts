import { Booking, PercentageAsRatio } from './types.js';
import { Clock } from './clock.js';
import { jsDateFns } from './jsDateFns.js';
import {isoDateFns, ValueType} from "@breezbook/packages-types";

export interface RefundPossible {
	_type: 'refund.possible';
	hoursToBookingStart: Hours;
	applicableRule: TimebasedRefundRule;
}

export interface BookingIsInThePast {
	_type: 'booking.is.in.the.past';
}

export interface NoRefundRuleFound {
	_type: 'no.refund.rule.found';
}

export type RefundJudgementResult = RefundPossible | BookingIsInThePast | NoRefundRuleFound;

export function findRefundRule(booking: Booking, policy: RefundPolicy, clock: Clock): RefundJudgementResult {
	const bookingStartTime = booking.period.from
	const bookingDate = isoDateFns.toJavascriptDate(booking.date, bookingStartTime);
	const hoursBeforeBookingStart = jsDateFns.hoursUntil(clock.now(), bookingDate);
	if (hoursBeforeBookingStart < 0) {
		return { _type: 'booking.is.in.the.past' };
	}
	const rules = [...policy.rules].sort((a, b) => b.hoursBeforeBookingStart.value - a.hoursBeforeBookingStart.value);

	const applicableRule = rules.find((rule) => rule.hoursBeforeBookingStart.value <= hoursBeforeBookingStart);
	if (!applicableRule) {
		return { _type: 'no.refund.rule.found' };
	}
	return { _type: 'refund.possible', hoursToBookingStart: hours(hoursBeforeBookingStart), applicableRule };
}

export interface Hours extends ValueType<number> {
	_type: 'hours';
}

export function hours(value: number): Hours {
	return { _type: 'hours', value };
}

export interface TimebasedRefundRule {
	_type: 'timebased.refund.rule';
	hoursBeforeBookingStart: Hours;
	percentage: PercentageAsRatio;
}

export function timebasedRefundRule(hoursBeforeBookingStart: Hours, percentage: PercentageAsRatio): TimebasedRefundRule {
	return { _type: 'timebased.refund.rule', hoursBeforeBookingStart, percentage };
}

export interface RefundPolicy {
	_type: 'refund.policy';
	rules: TimebasedRefundRule[];
}

export function refundPolicy(rules: TimebasedRefundRule[]): RefundPolicy {
	return { _type: 'refund.policy', rules };
}
