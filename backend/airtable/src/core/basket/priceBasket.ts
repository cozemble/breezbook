import { EverythingForTenant } from '../../express/getEverythingForTenant.js';
import { pricedAddOn, pricedBasket, PricedBasket, PricedBasketLine, pricedBasketLine, UnpricedBasket, UnpricedBasketLine } from './pricingTypes.js';
import { ErrorResponse } from '@breezbook/backend-api-types';
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
		const pricedAddOns = line.addOnIds.map((added) => {
			const addOn = mandatory(
				everythingForTenant.businessConfiguration.addOns.find((a) => a.id.value === added.addOnId.value),
				`Add on with id ${added.addOnId.value} not found`
			);
			return pricedAddOn(added.addOnId, added.quantity, priceFns.multiply(addOn.price, added.quantity));
		});
		const addOnTotal = pricedAddOns.length === 0 ? price(0, currency(availableSlot.priceCurrency)) : priceFns.add(...pricedAddOns.map((a) => a.price));
		const total = priceFns.add(price(availableSlot.priceWithNoDecimalPlaces, currency(availableSlot.priceCurrency)), addOnTotal);
		return pricedBasketLine(line.serviceId, pricedAddOns, total);
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
