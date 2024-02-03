import { booking, Booking, currency, Form, FormId, isoDateFns, mandatory, Order, orderLine, price, Price, priceFns } from '@breezbook/packages-core';
import { EverythingForTenant } from './getEverythingForTenant.js';
import { Availability, errorResponse, ErrorResponse } from '@breezbook/backend-api-types';
import { calculateOrderTotal } from '@breezbook/packages-core/dist/calculateOrderTotal.js';
import { applyBookingsToResourceAvailability } from '@breezbook/packages-core/dist/applyBookingsToResourceAvailability.js';
import { addOrderErrorCodes } from './addOrder.js';
import Ajv from 'ajv';
import { getAvailabilityForService } from '../core/getAvailabilityForService.js';

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

export function validateOrderTotal(everythingForTenant: EverythingForTenant, givenOrder: Order, postedOrderTotal: Price): ErrorResponse | null {
	const recalcedOrderLines = givenOrder.lines.map((line) => {
		const orderedSlot = line.slot;
		if (orderedSlot._type === 'exact.time.availability') {
			throw new Error(`Exact time availability not yet supported`);
		}

		const availability = getAvailabilityForService(everythingForTenant, line.serviceId, line.date, line.date);
		const slotsForLineDate = (availability.slots[line.date.value] ?? []) as Availability[];
		const pricedOrderedSlot = slotsForLineDate.find((s) => s.startTime24hr === orderedSlot.slot.from.value && s.endTime24hr === orderedSlot.slot.to.value);
		if (!pricedOrderedSlot) {
			throw new Error(`Slot ${orderedSlot.slot.from.value}-${orderedSlot.slot.to.value} not found in availability`);
		}
		const slotPrice = price(pricedOrderedSlot.priceWithNoDecimalPlaces, currency(pricedOrderedSlot.priceCurrency));
		return orderLine(line.serviceId, slotPrice, line.addOns, line.date, line.slot, line.serviceFormData);
	});
	const recalcedOrder = { ...givenOrder, lines: recalcedOrderLines };
	const calcedOrderTotal = calculateOrderTotal(recalcedOrder, everythingForTenant.businessConfiguration.addOns, everythingForTenant.coupons);
	if (!priceFns.isEqual(calcedOrderTotal.orderTotal, postedOrderTotal)) {
		return errorResponse(addOrderErrorCodes.wrongTotalPrice, `Expected ${calcedOrderTotal.orderTotal.amount.value} but got ${postedOrderTotal.amount.value}`);
	}
	return null;
}

export function validateTimeslotId(everythingForTenant: EverythingForTenant, order: Order): ErrorResponse | null {
	const timeslotIds = order.lines.flatMap((line) => (line.slot._type === 'timeslot.spec' ? [line.slot.id] : []));
	const invalidTimeslotIds = timeslotIds.filter((id) => !everythingForTenant.businessConfiguration.timeslots.some((ts) => ts.id.value === id.value));
	if (invalidTimeslotIds.length > 0) {
		return errorResponse(addOrderErrorCodes.noSuchTimeslotId, `Timeslot ids ${invalidTimeslotIds.join(', ')} not found`);
	}
	return null;
}
export function validateCustomerForm(everythingForTenant: EverythingForTenant, order: Order): ErrorResponse | null {
	if (everythingForTenant.tenantSettings.customerFormId) {
		if (!order.customer.formData) {
			return errorResponse(addOrderErrorCodes.customerFormMissing);
		} else {
			const formValidationError = validateForm(
				everythingForTenant.businessConfiguration.forms,
				everythingForTenant.tenantSettings.customerFormId,
				order.customer.formData
			);
			if (formValidationError) {
				return errorResponse(addOrderErrorCodes.customerFormInvalid, formValidationError);
			}
		}
	}
	return null;
}

export function validateServiceForms(everythingForTenant: EverythingForTenant, order: Order): ErrorResponse | null {
	for (let i = 0; i < order.lines.length; i++) {
		const line = order.lines[i];
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

export function validateAvailability(everythingForTenant: EverythingForTenant, order: Order) {
	const projectedBookings: Booking[] = [...everythingForTenant.bookings];
	for (let i = 0; i < order.lines.length; i++) {
		const line = order.lines[i];
		const projectedBooking = booking(order.customer.id, line.serviceId, line.date, line.slot);
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

export function validateCoupon(everythingForTenant: EverythingForTenant, order: Order) {
	const couponCode = order.couponCode;
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
