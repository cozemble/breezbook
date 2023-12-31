import { Form, Order, PaymentIntent, Price } from '@breezbook/packages-core';

export interface TimeSlotAvailability {
	_type: 'time.slot.availability';
	timeslotId: string;
	startTime24hr: string;
	endTime24hr: string;
	label: string;
	priceWithNoDecimalPlaces: number;
	priceCurrency: string;
}

export function timeSlotAvailability(
	timeslotId: string,
	startTime24hr: string,
	endTime24hr: string,
	label: string,
	priceWithNoDecimalPlaces: number,
	priceCurrency: string
): TimeSlotAvailability {
	return {
		_type: 'time.slot.availability',
		timeslotId,
		startTime24hr,
		endTime24hr,
		label,
		priceWithNoDecimalPlaces,
		priceCurrency
	};
}

export type Availability = TimeSlotAvailability;

export type Slots = Record<string, Availability[]>;

export interface ServiceSummary {
	id: string;
	name: string;
	durationMinutes: number;
	description: string;
	forms: Form[];
}

export interface AddOnSummary {
	id: string;
	name: string;
	priceWithNoDecimalPlaces: number;
	priceCurrency: string;
	requiresQuantity: boolean;
}

export interface AvailabilityResponse {
	slots: Slots;
	serviceSummary: ServiceSummary;
	addOns: AddOnSummary[];
}

export function emptyAvailabilityResponse(serviceSummary: ServiceSummary, addOns: AddOnSummary[]): AvailabilityResponse {
	return { serviceSummary, slots: {}, addOns };
}

export interface OrderCreatedResponse {
	_type: 'order.created.response';
	orderId: string;
	customerId: string;
	bookingIds: string[];
	reservationIds: string[];
	orderLineIds: string[];
}

export function orderCreatedResponse(
	orderId: string,
	customerId: string,
	bookingIds: string[],
	reservationIds: string[],
	orderLineIds: string[]
): OrderCreatedResponse {
	return { _type: 'order.created.response', orderId, customerId, bookingIds, reservationIds, orderLineIds };
}

export interface ErrorResponse {
	_type: 'error.response';
	errorCode: string;
	errorMessage?: string;
}

export function errorResponse(errorCode: string, errorMessage?: string): ErrorResponse {
	return { _type: 'error.response', errorCode, errorMessage };
}

export interface CreateOrderRequest {
	_type: 'create.order.request';
	order: Order;
	orderTotal: Price;
	paymentIntent: PaymentIntent;
}

export function createOrderRequest(order: Order, orderTotal: Price, paymentIntent: PaymentIntent): CreateOrderRequest {
	return { _type: 'create.order.request', order, orderTotal, paymentIntent };
}
