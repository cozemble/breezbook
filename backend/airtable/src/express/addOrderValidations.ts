import {booking, Booking, CouponCode, Form, FormId, isoDateFns, mandatory} from '@breezbook/packages-core';
import {EverythingForAvailability} from './getEverythingForAvailability.js';
import {errorResponse, ErrorResponse, pricedBasketFns, PricedCreateOrderRequest} from '@breezbook/backend-api-types';
import {
    applyBookingsToResourceAvailability
} from '@breezbook/packages-core/dist/applyBookingsToResourceAvailability.js';
import {addOrderErrorCodes} from './addOrder.js';
import Ajv from 'ajv';
import {priceBasket} from "../core/basket/priceBasket.js";

// @ts-ignore
const ajv = new Ajv({allErrors: true});

function validateForm(forms: Form[], formId: FormId, formData: unknown): string | null {
    const form = mandatory(
        forms.find((f) => f.id.value === formId.value),
        `Form with id ${formId.value} not found`
    );
    if (form._type === 'json.schema.form') {
        const validate = ajv.compile(form.schema);
        const valid = validate(formData);
        if (!valid) {
            return ajv.errorsText(validate.errors);
        }
        return null;
    } else {
        throw new Error(`Form type ${form._type} not supported`);
    }
}

export function validateOrderTotal(everythingForTenant: EverythingForAvailability, pricedBasket: PricedCreateOrderRequest): ErrorResponse | null {
    const unpricedBasket = pricedBasketFns.toUnpricedBasket(pricedBasket.basket);
    const repricedBasket = priceBasket(everythingForTenant, unpricedBasket);
    if (repricedBasket._type === 'error.response') {
        return repricedBasket;
    }
    if (repricedBasket.total.amount.value !== pricedBasket.basket.total.amount.value) {
        return errorResponse(addOrderErrorCodes.wrongTotalPrice, `Expected ${repricedBasket.total.amount.value} but got ${pricedBasket.basket.total.amount.value}`);
    }
    if(repricedBasket.discount && repricedBasket.discount.amount.value !== pricedBasket.basket.discount?.amount.value) {
        return errorResponse(addOrderErrorCodes.incorrectDiscountAmount, `Expected discount ${repricedBasket.discount.amount.value} but got ${pricedBasket.basket.discount?.amount.value ?? 'nothing'}`);
    }
    return null;
}

export function validateTimeslotId(everythingForTenant: EverythingForAvailability, pricedCreateOrderRequest: PricedCreateOrderRequest): ErrorResponse | null {
    const timeslotIds = pricedCreateOrderRequest.basket.lines.flatMap((line) => (line.timeslot._type === 'timeslot.spec' ? [line.timeslot.id] : []));
    const invalidTimeslotIds = timeslotIds.filter((id) => !everythingForTenant.businessConfiguration.timeslots.some((ts) => ts.id.value === id.value));
    if (invalidTimeslotIds.length > 0) {
        return errorResponse(addOrderErrorCodes.noSuchTimeslotId, `Timeslot ids ${invalidTimeslotIds.join(', ')} not found`);
    }
    return null;
}

export function validateCustomerForm(everythingForTenant: EverythingForAvailability, pricedCreateOrderRequest: PricedCreateOrderRequest): ErrorResponse | null {
    if (everythingForTenant.tenantSettings.customerFormId) {
        if (!pricedCreateOrderRequest.customer.formData) {
            return errorResponse(addOrderErrorCodes.customerFormMissing);
        } else {
            const formValidationError = validateForm(
                everythingForTenant.businessConfiguration.forms,
                everythingForTenant.tenantSettings.customerFormId,
                pricedCreateOrderRequest.customer.formData
            );
            if (formValidationError) {
                return errorResponse(addOrderErrorCodes.customerFormInvalid, formValidationError);
            }
        }
    }
    return null;
}

export function validateServiceForms(everythingForTenant: EverythingForAvailability, order: PricedCreateOrderRequest): ErrorResponse | null {
    for (let i = 0; i < order.basket.lines.length; i++) {
        const line = order.basket.lines[i];
        const service = mandatory(
            everythingForTenant.businessConfiguration.services.find((s) => s.id.value === line.serviceId.value),
            `Service with id ${line.serviceId.value} not found`
        );
        for (let serviceFormIndex = 0; serviceFormIndex < service.serviceFormIds.length; serviceFormIndex++) {
            const serviceFormId = service.serviceFormIds[serviceFormIndex];
            const formData = line.serviceFormData[serviceFormIndex] as unknown;
            if (!formData) {
                return errorResponse(addOrderErrorCodes.serviceFormMissing, `Service form ${serviceFormId.value} missing in order line ${i}`);
            }
            const formValidationError = validateForm(everythingForTenant.businessConfiguration.forms, serviceFormId, formData);
            if (formValidationError) {
                return errorResponse(addOrderErrorCodes.serviceFormInvalid, formValidationError + ` for service ${service.name} in order line ${i}`);
            }
        }
    }
    return null;
}

export function validateAvailability(everythingForTenant: EverythingForAvailability, order: PricedCreateOrderRequest) {
    const projectedBookings: Booking[] = [...everythingForTenant.bookings];
    for (let i = 0; i < order.basket.lines.length; i++) {
        const line = order.basket.lines[i];
        const projectedBooking = booking(order.customer.id, line.serviceId, line.date, line.timeslot);
        projectedBookings.push(projectedBooking);
        try {
            applyBookingsToResourceAvailability(
                everythingForTenant.businessConfiguration.resourceAvailability,
                projectedBookings,
                everythingForTenant.businessConfiguration.services
            );
        } catch (e: unknown) {
            return errorResponse(addOrderErrorCodes.noAvailability, (e as Error).message + ` for service ${line.serviceId.value} in order line ${i}`);
        }
    }
    return null;
}

export function validateCouponCode(everythingForTenant: EverythingForAvailability, couponCode: CouponCode | undefined) {
    if (couponCode) {
        const coupon = everythingForTenant.coupons.find((c) => c.code.value === couponCode.value);
        if (!coupon) {
            return errorResponse(addOrderErrorCodes.noSuchCoupon, `Coupon ${couponCode.value} not found`);
        }
        if (coupon) {
            if (!(isoDateFns.gte(isoDateFns.today(), coupon.validFrom) && isoDateFns.lte(isoDateFns.today(), coupon.validTo ?? isoDateFns.today()))) {
                return errorResponse(addOrderErrorCodes.expiredCoupon, `Coupon ${coupon.code.value} expired`);
            }
        }
    }
    return null;
}

export function validateCoupon(everythingForTenant: EverythingForAvailability, order: PricedCreateOrderRequest) {
    return validateCouponCode(everythingForTenant, order.basket.couponCode);
}
