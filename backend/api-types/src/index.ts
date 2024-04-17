import { Form, Order, PaymentIntent, Price } from '@breezbook/packages-core';
import { BookingIsInThePast } from '@breezbook/packages-core/dist/cancellation.js';
import { v4 as uuidv4 } from 'uuid';

export * from './secrets.js';
export * from './pricingTypes.js';

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
	description: string | null;
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

export function isErrorResponse(response: unknown): response is ErrorResponse {
	return (response as ErrorResponse)._type === 'error.response';
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

export interface PaymentIntentResponse {
	stripePublicKey: string;
	clientSecret: string;
}

export interface CancellationGranted {
	_type: 'cancellation.granted';
	cancellationId: string;
	bookingId: string;
	refundPercentageAsRatio: number;
	hoursBeforeBookingStart: number | null;
}

export function cancellationGranted(
	refundPercentageAsRatio: number,
	hoursBeforeBookingStart: number | null,
	bookingId: string,
	cancellationId = uuidv4()
): CancellationGranted {
	return { _type: 'cancellation.granted', bookingId, cancellationId, refundPercentageAsRatio, hoursBeforeBookingStart };
}

export type CancellationGrantResponse = CancellationGranted | BookingIsInThePast;

export interface ChangeDates {
	environmentId: string;
	from: string;
	to: string;
}

export interface Service {
	id: string;
	slug: string;
	name: string;
	description: string;
	priceWithNoDecimalPlaces: number;
	priceCurrency: string;
	hasDynamicPricing: boolean;
	durationMinutes: number;
	image: string;
}

export interface Tenant {
	id: string;
	slug: string;
	name: string;
	heading: string;
	description: string;
	heroImage: string;
}