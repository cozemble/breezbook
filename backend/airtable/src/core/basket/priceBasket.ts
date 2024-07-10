import {EverythingForAvailability} from '../../express/getEverythingForAvailability.js';
import {
    Availability,
    errorResponse,
    ErrorResponse,
    pricedAddOn,
    PricedBasket,
    pricedBasket,
    pricedBasketLine,
    PricedBasketLine,
    UnpricedBasket,
    UnpricedBasketLine
} from '@breezbook/backend-api-types';
import {
    currencies,
    currency,
    errorResponseFns,
    isErrorResponse,
    mandatory,
    price,
    priceFns,
    success,
    Success
} from '@breezbook/packages-core';
import {getAvailabilityForService} from '../getAvailabilityForService.js';
import {validateCouponCode} from '../../express/addOrderValidations.js';

export const pricingErrorCodes = {
    pricingError: 'pricing.error'
};

function priceLine(unpricedLines: UnpricedBasketLine[], everythingForTenant: EverythingForAvailability): PricedBasketLine[] | ErrorResponse {
    const lines = unpricedLines.map((line) => {
        const availability = getAvailabilityForService(everythingForTenant, line.serviceId, line.options,line.date, line.date);
        if (availability._type === 'error.response') {
            return availability;
        }
        if (Object.keys(availability.slots).length === 0) {
            throw new Error(`No availability found for service '${line.serviceId.value}' on date '${line.date.value}'`);
        }
        const slotsForDate = (availability.slots[line.date.value] ?? []) as Availability[]
        const availableSlot = slotsForDate.find((slot) => slot.startTime24hr === line.startTime.value);
        if (!availableSlot) {
            const availableSlotIds = slotsForDate.map(a => a.timeslotId)
            throw new Error(`Slot '${line.startTime.value}' not found in availability for service '${line.serviceId.value}' on date '${line.date.value}', available slot ids are '${availableSlotIds.join(",")}'`);
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
        return pricedBasketLine(line.locationId, line.serviceId, pricedAddOns, servicePrice, total, line.date, line.startTime, line.serviceFormData, line.resourceRequirementOverrides);
    });
    return errorResponseFns.arrayOrError(lines);
}

function priceLines(everythingForTenant: EverythingForAvailability, unpricedLines: UnpricedBasket["lines"]): ErrorResponse | Success<PricedBasketLine[]> {
    try {
        const outcome: PricedBasketLine[] | ErrorResponse = priceLine(unpricedLines, everythingForTenant);
        if (isErrorResponse(outcome)) {
            return outcome;
        }
        return success(outcome as PricedBasketLine[]);
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
