import {
	availability,
	availabilityConfiguration,
	booking,
	businessAvailability,
	mandatory
} from '@breezbook/packages-core';
import { EverythingForAvailability } from './getEverythingForAvailability.js';
import { errorResponse, ErrorResponse } from '@breezbook/backend-api-types';
import { addOrderErrorCodes, EverythingToCreateOrder, hydratedBasketFns } from './onAddOrderExpress.js';
import Ajv from 'ajv';
import { priceBasket } from '../core/basket/priceBasket.js';
import {
	IsoDate,
	isoDateFns,
	time24Fns,
	TimePeriod,
	timePeriod,
	timePeriodFns,
	timezones
} from '@breezbook/packages-date-time';
import { CouponCode, Form, FormId } from '@breezbook/packages-types';
import { resourcing } from '@breezbook/packages-resourcing';

// @ts-ignore
const ajv = new Ajv({ allErrors: true });

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

export function validateOrderTotal(everythingForAvailability: EverythingForAvailability, everythingToCreateOrder: EverythingToCreateOrder): ErrorResponse | null {
	const unpricedBasket = hydratedBasketFns.toUnpricedBasket(everythingToCreateOrder.basket);
	const repricedBasket = priceBasket(everythingForAvailability, unpricedBasket);
	if (repricedBasket._type === 'error.response') {
		return repricedBasket;
	}
	if (repricedBasket.total.amount.value !== everythingToCreateOrder.basket.total.amount.value) {
		return errorResponse(addOrderErrorCodes.wrongTotalPrice, `Expected ${repricedBasket.total.amount.value} but got ${everythingToCreateOrder.basket.total.amount.value}`);
	}
	if (repricedBasket.discount && repricedBasket.discount.amount.value !== everythingToCreateOrder.basket.discount?.amount.value) {
		return errorResponse(addOrderErrorCodes.incorrectDiscountAmount, `Expected discount ${repricedBasket.discount.amount.value} but got ${everythingToCreateOrder.basket.discount?.amount.value ?? 'nothing'}`);
	}
	return null;
}

// export function validateTimeslotId(everythingForTenant: EverythingForAvailability, pricedCreateOrderRequest: PricedCreateOrderRequest): ErrorResponse | null {
//     const timeslotIds = pricedCreateOrderRequest.basket.lines.flatMap((line) => (line.timeslot._type === 'timeslot.spec' ? [line.timeslot.id] : []));
//     const invalidTimeslotIds = timeslotIds.filter((id) => !everythingForTenant.businessConfiguration.timeslots.some((ts) => ts.id.value === id.value));
//     if (invalidTimeslotIds.length > 0) {
//         return errorResponse(addOrderErrorCodes.noSuchTimeslotId, `Timeslot ids ${invalidTimeslotIds.join(', ')} not found`);
//     }
//     return null;
// }

export function validateCustomerForm(everythingForTenant: EverythingForAvailability, everythingToCreateOrder: EverythingToCreateOrder): ErrorResponse | null {
	if (everythingForTenant.tenantSettings.customerFormId) {
		if (!everythingToCreateOrder.customer.formData) {
			return errorResponse(addOrderErrorCodes.customerFormMissing);
		} else {
			const formValidationError = validateForm(
				everythingForTenant.businessConfiguration.forms,
				everythingForTenant.tenantSettings.customerFormId,
				everythingToCreateOrder.customer.formData
			);
			if (formValidationError) {
				return errorResponse(addOrderErrorCodes.customerFormInvalid, formValidationError);
			}
		}
	}
	return null;
}

export function validateServiceForms(everythingForTenant: EverythingForAvailability, everythingToCreateOrder: EverythingToCreateOrder): ErrorResponse | null {
	for (let i = 0; i < everythingToCreateOrder.basket.lines.length; i++) {
		const line = mandatory(everythingToCreateOrder.basket.lines[i], `Order line ${i} missing`);
		const service = line.service;
		for (let serviceFormIndex = 0; serviceFormIndex < service.serviceFormIds.length; serviceFormIndex++) {
			const serviceFormId = mandatory(service.serviceFormIds[serviceFormIndex], `Service form id missing in order line ${i}`);
			const formData = line.serviceFormData[serviceFormIndex] as unknown;
			if (!formData) {
				return errorResponse(addOrderErrorCodes.serviceFormMissing, `Service form ${serviceFormId.value} missing in order line ${i}`);
			}
			const formValidationError = validateForm(everythingForTenant.businessConfiguration.forms, serviceFormId, formData);
			if (formValidationError) {
				return errorResponse(addOrderErrorCodes.serviceFormInvalid, formValidationError + ` for service ${service.id.value} in order line ${i}`);
			}
		}
	}
	return null;
}

export function validateAvailability(everythingForAvailability: EverythingForAvailability, everythingToCreateOrder: EverythingToCreateOrder) {
	const availabilityConfig = availabilityConfiguration(
		businessAvailability(everythingForAvailability.businessConfiguration.availability.availability),
		everythingForAvailability.businessConfiguration.resourceAvailability,
		everythingForAvailability.businessConfiguration.timeslots,
		everythingForAvailability.businessConfiguration.startTimeSpec, everythingForAvailability.locationTimezone);
	const newBookings = everythingToCreateOrder.basket.lines.map(line => booking(everythingToCreateOrder.customer.id, line.service, line.date, timePeriod(line.startTime, time24Fns.addDuration(line.startTime, line.duration))));
	const availabilityOutcomes: resourcing.ResourceBookingResult[] = availability.checkAvailability(availabilityConfig, everythingForAvailability.bookings, newBookings);
	for (const [index, outcome] of availabilityOutcomes.entries()) {
		if (outcome._type === 'unresourceable.booking') {
			const line = mandatory(everythingToCreateOrder.basket.lines[index], `Order line ${index} missing`);
			return errorResponse(addOrderErrorCodes.noAvailability, `For service ${line.service.id.value} in order line ${index}`);
		}
	}
	return null;
}

function businessIsOpen(everythingForTenant: EverythingForAvailability, date: IsoDate, period: TimePeriod): ErrorResponse | null {
	const availability = mandatory(everythingForTenant.businessConfiguration.availability.availability.find(a => a.day.value === date.value), `Did not find business availability for date ${date.value}`);
	if (timePeriodFns.overlaps(availability.period, period)) {
		return null;
	}
	return errorResponse(addOrderErrorCodes.businessIsNotOpenAtThatTime, `Business is not open at ${period.from.value} on ${date.value}`);
}

export function validateOpeningHours(everythingForTenant: EverythingForAvailability, everythingToCreateOrder: EverythingToCreateOrder): ErrorResponse | null {
	const validationOutcomes = everythingToCreateOrder.basket.lines.map(line => businessIsOpen(everythingForTenant, line.date, timePeriodFns.calcPeriod(line.startTime, line.duration)));
	return validationOutcomes.find(o => o != null) ?? null;
}

function dateIsInTheFuture(date: IsoDate) {
	if (isoDateFns.lt(date, isoDateFns.today(timezones.utc))) {
		return errorResponse(addOrderErrorCodes.serviceDateInThePast, `Service date ${date.value} is in the past, today is ${isoDateFns.today(timezones.utc).value}`);
	}
	return null;
}

export function validateServiceDates(_: EverythingForAvailability, everythingToCreateOrder: EverythingToCreateOrder): ErrorResponse | null {
	const validationOutcomes = everythingToCreateOrder.basket.lines.map(line => dateIsInTheFuture(line.date));
	return validationOutcomes.find(o => o != null) ?? null;
}

export function validateCouponCode(everythingForTenant: EverythingForAvailability, couponCode: CouponCode | undefined) {
	if (couponCode) {
		const coupon = everythingForTenant.coupons.find((c) => c.code.value === couponCode.value);
		if (!coupon) {
			return errorResponse(addOrderErrorCodes.noSuchCoupon, `Coupon ${couponCode.value} not found`);
		}
		if (coupon) {
			if (!(isoDateFns.gte(isoDateFns.today(timezones.utc), coupon.validFrom) && isoDateFns.lte(isoDateFns.today(timezones.utc), coupon.validTo ?? isoDateFns.today(timezones.utc)))) {
				return errorResponse(addOrderErrorCodes.expiredCoupon, `Coupon ${coupon.code.value} expired`);
			}
		}
	}
	return null;
}

export function validateCoupon(everythingForTenant: EverythingForAvailability, everythingToCreateOrder: EverythingToCreateOrder) {
	return validateCouponCode(everythingForTenant, everythingToCreateOrder.basket.coupon?.code);
}
