import { EverythingForAvailability } from '../../express/getEverythingForAvailability.js';
import {
	errorResponse,
	pricedAddOn,
	pricedBasket,
	PricedBasket,
	PricedBasketLine,
	pricedBasketLine,
	UnpricedBasket,
	UnpricedBasketLine
} from '@breezbook/backend-api-types';
import { ErrorResponse } from '@breezbook/backend-api-types';
import { currencies, currency, mandatory, price, priceFns, success, Success } from '@breezbook/packages-core';
import { getAvailabilityForService } from '../getAvailabilityForService.js';
import { validateCouponCode } from '../../express/addOrderValidations.js';

export const pricingErrorCodes = {
	pricingError: 'pricing.error'
};

function priceLine(unpricedLines: UnpricedBasketLine[], everythingForTenant: EverythingForAvailability) {
	return unpricedLines.map((line) => {
		const availability = getAvailabilityForService(everythingForTenant, line.serviceId, line.date, line.date);
		const availableSlot = (availability.slots[line.date.value] ?? []).find((slot) => slot.timeslotId === line.timeslot.id.value);
		if (!availableSlot) {
			throw new Error(`Slot ${line.timeslot.id.value} not found in availability for service ${line.serviceId.value} on date ${line.date.value}`);
		}
		const pricedAddOns = line.addOnIds.map((added) => {
			const addOn = mandatory(
				everythingForTenant.businessConfiguration.addOns.find((a) => a.id.value === added.addOnId.value),
				`Add on with id ${added.addOnId.value} not found`
			);
			return pricedAddOn(added.addOnId, added.quantity, priceFns.multiply(addOn.price, added.quantity));
		});
		const addOnTotal = pricedAddOns.length === 0 ? price(0, currency(availableSlot.priceCurrency)) : priceFns.add(...pricedAddOns.map((a) => a.price));
		const servicePrice = price(availableSlot.priceWithNoDecimalPlaces, currency(availableSlot.priceCurrency));
		const total = priceFns.add(servicePrice, addOnTotal);
		return pricedBasketLine(line.serviceId, pricedAddOns, servicePrice, total);
	});
}

function priceLines(everythingForTenant: EverythingForAvailability, unpricedLines: UnpricedBasket['lines']): ErrorResponse | Success<PricedBasketLine[]> {
	try {
		return success(priceLine(unpricedLines, everythingForTenant));
	} catch (e: any) {
		return errorResponse(pricingErrorCodes.pricingError, e.message);
	}
}

export function priceBasket(everythingForTenant: EverythingForAvailability, unpricedBasket: UnpricedBasket): PricedBasket | ErrorResponse {
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
