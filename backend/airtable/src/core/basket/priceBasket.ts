import { EverythingForTenant } from '../../express/getEverythingForTenant.js';
import { pricedBasket, PricedBasket, PricedBasketLine, pricedBasketLine, UnpricedBasket, UnpricedBasketLine } from './pricingTypes.js';
import { errorResponse, ErrorResponse } from '@breezbook/backend-api-types';
import { currencies, currency, mandatory, price, priceFns, success, Success } from '@breezbook/packages-core';
import { getAvailabilityForService } from '../getAvailabilityForService.js';
import { validateCouponCode } from '../../express/addOrderValidations.js';

function priceLine(unpricedLines: UnpricedBasketLine[], everythingForTenant: EverythingForTenant) {
	return unpricedLines.map((line) => {
		const availability = getAvailabilityForService(everythingForTenant, line.serviceId, line.date, line.date);
		const availableSlot = availability.slots[line.date.value].find((slot) => slot.timeslotId === line.timeslot.id.value);
		if (!availableSlot) {
			throw new Error(`Slot ${line.timeslot.id.value} not found in availability for service ${line.serviceId.value} on date ${line.date.value}`);
		}
		return pricedBasketLine(line.serviceId, [], price(availableSlot.priceWithNoDecimalPlaces, currency(availableSlot.priceCurrency)));
	});
}

function priceLines(everythingForTenant: EverythingForTenant, unpricedLines: UnpricedBasket['lines']): ErrorResponse | Success<PricedBasketLine[]> {
	return success(priceLine(unpricedLines, everythingForTenant));
}

export function priceBasket(everythingForTenant: EverythingForTenant, unpricedBasket: UnpricedBasket): PricedBasket | ErrorResponse {
	const pricedLines = priceLines(everythingForTenant, unpricedBasket.lines);
	if (pricedLines._type === 'error.response') {
		return pricedLines;
	}
	const lines = pricedLines.value;
	const total = lines.length === 0 ? price(0, currencies.NULL) : priceFns.add(...lines.map((line) => line.total));
	if (unpricedBasket.couponCode) {
		const maybeError = validateCouponCode(everythingForTenant, unpricedBasket.couponCode);
		if (maybeError && maybeError._type === 'error.response') {
			return maybeError;
		}
		const coupon = mandatory(
			everythingForTenant.coupons.find((c) => c.code.value === unpricedBasket.couponCode?.value),
			`Coupon not found`
		);
		const discount = coupon.value._type === 'amount.coupon' ? coupon.value.amount : priceFns.multiply(total, coupon.value.percentage.value);
		return pricedBasket(lines, priceFns.subtract(total, discount), unpricedBasket.couponCode, discount);
	}
	return pricedBasket(lines, total, unpricedBasket.couponCode);
}
