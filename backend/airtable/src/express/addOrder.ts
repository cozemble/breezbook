import * as express from 'express';
import { orderAndTotalBody, tenantIdParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import {
	booking,
	Booking,
	calcSlotPeriod,
	currency,
	Form,
	FormId,
	isoDateFns,
	mandatory,
	Order,
	orderFns,
	orderLine,
	price,
	Price,
	priceFns,
	TenantId
} from '@breezbook/packages-core';
import { EverythingForTenant, getEverythingForTenant } from './getEverythingForTenant.js';
import { prismaClient } from '../prisma/client.js';
import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import { DbBooking, DbOrderLine } from '../prisma/dbtypes.js';
import { Availability, ErrorResponse, errorResponse } from '../apiTypes.js';
import Ajv from 'ajv';
import { applyBookingsToResourceAvailability } from '@breezbook/packages-core/dist/applyBookingsToResourceAvailability.js';
import { getAvailabilityForService } from './getServiceAvailability.js';
import { calculateOrderTotal } from '@breezbook/packages-core/dist/calculateOrderTotal.js';

// @ts-ignore
const ajv = new Ajv({ allErrors: true });

export const addOrderErrorCodes = {
	customerFormMissing: 'addOrder.customer.form.missing',
	customerFormInvalid: 'addOrder.customer.form.invalid',
	serviceFormMissing: 'addOrder.service.form.missing',
	serviceFormInvalid: 'addOrder.service.form.invalid',
	noAvailability: 'addOrder.no.availability',
	noSuchCoupon: 'addOrder.no.such.coupon',
	expiredCoupon: 'addOrder.expired.coupon',
	wrongTotalPrice: 'addOrder.wrong.total.price'
};

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

function validateOrderTotal(everythingForTenant: EverythingForTenant, givenOrder: Order, postedOrderTotal: Price): ErrorResponse | null {
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
	const calcedOrderTotal = calculateOrderTotal(
		recalcedOrder,
		everythingForTenant.businessConfiguration.services,
		everythingForTenant.businessConfiguration.addOns,
		everythingForTenant.coupons
	);
	if (!priceFns.isEqual(calcedOrderTotal.orderTotal, postedOrderTotal)) {
		return errorResponse(addOrderErrorCodes.wrongTotalPrice, `Expected ${calcedOrderTotal.orderTotal.amount.value} but got ${postedOrderTotal.amount.value}`);
	}
	return null;
}

function validateCustomerForm(everythingForTenant: EverythingForTenant, order: Order): ErrorResponse | null {
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

function validateServiceForms(everythingForTenant: EverythingForTenant, order: Order): ErrorResponse | null {
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

function validateAvailability(everythingForTenant: EverythingForTenant, order: Order) {
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

function validateCoupon(everythingForTenant: EverythingForTenant, order: Order) {
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

async function withValidationsPerformed(
	everythingForTenant: EverythingForTenant,
	order: Order,
	orderTotal: Price,
	res: express.Response,
	fn: () => Promise<void>
) {
	const validationFns = [
		() => validateCustomerForm(everythingForTenant, order),
		() => validateServiceForms(everythingForTenant, order),
		() => validateAvailability(everythingForTenant, order),
		() => validateCoupon(everythingForTenant, order),
		() => validateOrderTotal(everythingForTenant, order, orderTotal)
	];

	for (const validationFn of validationFns) {
		const validationError = validationFn();
		if (validationError) {
			res.status(400).send(validationError);
			return;
		}
	}

	await fn();
}

async function insertOrder(tenantId: TenantId, order: Order, everythingForTenant: EverythingForTenant, res: express.Response) {
	const prisma = prismaClient();
	const tenant_id = tenantId.value;
	const email = order.customer.email;
	const customerUpsert = prisma.customers.upsert({
		where: { tenant_id_email: { tenant_id: tenantId.value, email } },
		update: { first_name: order.customer.firstName, last_name: order.customer.lastName, tenant_id },
		create: {
			email,
			first_name: order.customer.firstName,
			last_name: order.customer.lastName,
			tenants: {
				connect: { tenant_id: tenantId.value }
			}
		}
	});
	const orderId = uuidv4();
	const createOrder = prisma.orders.create({
		data: {
			id: orderId,
			customers: {
				connect: { tenant_id_email: { tenant_id, email } }
			},
			tenants: {
				connect: { tenant_id: tenantId.value }
			}
		}
	});
	const lineInserts: Prisma.PrismaPromise<unknown>[] = [];
	for (const line of order.lines) {
		const service = mandatory(
			everythingForTenant.businessConfiguration.services.find((s) => s.id.value === line.serviceId.value),
			`Service with id ${line.serviceId.value} not found`
		);
		const servicePeriod = calcSlotPeriod(line.slot, service.duration);
		const time_slot_id = line.slot._type === 'timeslot.spec' ? line.slot.id.value : null;
		lineInserts.push(
			prisma.order_lines.create({
				data: {
					tenant_id: tenantId.value,
					order_id: orderId,
					service_id: line.serviceId.value,
					time_slot_id: time_slot_id,
					start_time_24hr: servicePeriod.from.value,
					end_time_24hr: servicePeriod.to.value,
					add_on_ids: line.addOns.map((a) => a.addOnId.value),
					date: line.date.value
				}
			})
		);
		lineInserts.push(
			prisma.bookings.create({
				data: {
					tenants: {
						connect: { tenant_id: tenantId.value }
					},
					services: {
						connect: { id: line.serviceId.value }
					},
					orders: {
						connect: { id: orderId }
					},
					customers: {
						connect: { tenant_id_email: { tenant_id, email } }
					},
					time_slots: {
						connect: line.slot._type === 'timeslot.spec' ? { id: line.slot.id.value } : undefined
					},
					date: line.date.value,
					start_time_24hr: servicePeriod.from.value,
					end_time_24hr: servicePeriod.to.value
				}
			})
		);
	}
	const [customerOutcome, orderOutcome, ...remainingOutcomes] = await prisma.$transaction([customerUpsert, createOrder, ...lineInserts]);
	const orderLineOutcomes: DbOrderLine[] = [];
	const bookingOutcomes: DbBooking[] = [];

	for (let i = 0; i < remainingOutcomes.length; i++) {
		if (i % 2 == 0) {
			orderLineOutcomes.push(remainingOutcomes[i] as DbOrderLine);
		} else {
			bookingOutcomes.push(remainingOutcomes[i] as DbBooking);
		}
	}

	res.send({
		orderId: orderOutcome.id,
		customerId: customerOutcome.id,
		bookingIds: bookingOutcomes.map((b) => b.id),
		orderLineIds: orderLineOutcomes.map((ol) => ol.id)
	});
}

export async function addOrder(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, tenantIdParam(), orderAndTotalBody(), async (tenantId, orderAndTotal) => {
		const { fromDate, toDate } = orderFns.getOrderDateRange(orderAndTotal.order);
		const everythingForTenant = await getEverythingForTenant(tenantId, fromDate, toDate);
		await withValidationsPerformed(everythingForTenant, orderAndTotal.order, orderAndTotal.total, res, async () => {
			await insertOrder(tenantId, orderAndTotal.order, everythingForTenant, res);
		});
	});
}
