import {EverythingForAvailability} from '../../express/getEverythingForAvailability.js';
import {
    Availability,
    errorResponse,
    ErrorResponse,
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
import {validateCouponCode} from '../../express/addOrderValidations.js';
import {
    requirementOverride,
    serviceAvailabilityRequest
} from "../../express/availability/getServiceAvailabilityForLocation.js";
import {serviceOptionRequest} from "@breezbook/packages-types";
import {getAvailabilityForService} from "../../availability/getAvailabilityForService.js";

export const pricingErrorCodes = {
    pricingError: 'pricing.error'
};

function priceLine(unpricedLines: UnpricedBasketLine[], everythingForTenant: EverythingForAvailability): PricedBasketLine[] | ErrorResponse {
    const lines = unpricedLines.map((line) => {
        const request = serviceAvailabilityRequest(line.serviceId, line.date, line.date,
            line.addOnIds,
            line.resourceRequirementOverrides.map(a => requirementOverride(a.requirementId, a.resourceId)),
            line.options.map((a) => serviceOptionRequest(a.serviceOptionId, a.quantity)))
        const availability = getAvailabilityForService(everythingForTenant, request);
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
        return pricedBasketLine(line.locationId, line.serviceId, line.capacity, availableSlot.priceBreakdown, line.date, line.startTime, line.duration,line.serviceFormData, line.resourceRequirementOverrides);
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
    const total = lines.length === 0 ? price(0, currencies.NULL) : priceFns.add(...lines.map((line) => price(line.priceBreakdown.total, currency(line.priceBreakdown.currency))));
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
