/**
 * What kind of pricing rules might a business want.  I am not talking about coupons or discounts here, but rather
 * the basic pricing rules that apply to a service.
 *
 * 1. A fixed price for a service
 * 2. Soon-ness pricing: the closer to the booking date, the more expensive the service.  Tomorrow is more expensive than the day after tomorrow
 * 3. Time of day pricing: 9am is more expensive than 3pm
 * 4. Day of week pricing: Saturday is more expensive than Tuesday
 * 5. Time of year pricing: Christmas is more expensive than January
 * 6. Resource type pricing: a van is more expensive than a car - never thought of this option, that a service might have resource type choices.  Add-ons will not do, because resource
 * consumption is key to scheduling
 * 7. Surge pricing - when demand is high, prices go up
 * 8. More specifics on resource based pricing - one instructor might be more expensive than another
 *
 * This can be reduced to:
 * 1. Base Rate: Establish a standard base rate for each service, which serves as the starting point for any price adjustments.
 *
 * 2. Time-Sensitive Pricing: Adjust prices based on the booking's proximity to the service date. For example, prices increase as the service date nears.
 *
 * 3. Demand-Based Pricing: Modify prices in response to varying levels of demand. This includes:
 *
 *      3.1 Time of Day Variations: Higher prices during peak hours, lower during off-peak hours.
 *      3.2 Day of Week Variations: Different prices for weekends versus weekdays.
 *      3.3 Seasonal Variations: Adjusted prices for high-demand seasons or specific times of the year.
 *      3.4 Surge Pricing: Increased prices during times of exceptionally high demand.
 *      3.5 Special Event Pricing: Higher prices for special events, like holidays or concerts.
 *
 * 4. Resource-Dependent Pricing: Price differentiation based on the resources required for the service (like different types of vehicles or equipment).
 *
 * 5. Customer-Based Pricing: Adjust prices based on the customer's characteristics, such as their location or loyalty status.
 *
 * 6. Location-Based Pricing: Different prices for different locations, such as different cities or neighborhoods.
 *
 * 7. Channel-Based Pricing: Different prices for different booking channels, such as online versus in-person.
 */
import { price, Price, priceFns } from './types.js';
import { AvailableSlot, availableSlotFns } from './availability.js';
import * as pricing from '@breezbook/packages-pricing';
import {
	durationFns,
	isoDateFns,
	minuteFns,
	timePeriod,
	timePeriodFns,
	TwentyFourHourClockTime
} from '@breezbook/packages-date-time';
import { AddOnId, ServiceOptionId } from '@breezbook/packages-types';


export interface PricedServiceOption {
	serviceOptionId: ServiceOptionId;
	unitPrice: Price;
	quantity: number;
	price: Price;
}

export function pricedServiceOption(serviceOptionId: ServiceOptionId, unitPrice: Price, quantity: number, price: Price): PricedServiceOption {
	return {
		serviceOptionId,
		unitPrice,
		quantity,
		price
	};
}

export interface PricedAddOn {
	addOnId: AddOnId;
	unitPrice: Price;
	quantity: number;
	price: Price;
}

export function pricedAddOn(addOnId: AddOnId, unitPrice: Price, quantity: number, price: Price): PricedAddOn {
	return {
		addOnId,
		unitPrice,
		quantity,
		price
	};
}


export interface PriceBreakdown {
	servicePrice: Price;
	pricedAddOns: PricedAddOn[];
	pricedOptions: PricedServiceOption[];
	total: Price;
}

export function priceBreakdown(servicePrice: Price, pricedAddOns: PricedAddOn[], pricedOptions: PricedServiceOption[], givenTotal: Price | null = null): PriceBreakdown {
	const total = givenTotal ?? priceFns.add(...[servicePrice, ...pricedAddOns.map(po => po.price), ...pricedOptions.map(po => po.price)]);
	return {
		servicePrice,
		pricedAddOns,
		pricedOptions,
		total
	};
}

export interface PricedSlot {
	_type: 'priced.slot';
	slot: AvailableSlot;
	price: Price;
	breakdown: PriceBreakdown;
	adjustments: pricing.PriceAdjustment[];
}

export function pricedSlot(slot: AvailableSlot, breakdown: PriceBreakdown, adjustments: pricing.PriceAdjustment[] = []): PricedSlot {
	return {
		_type: 'priced.slot',
		slot,
		price: breakdown.total,
		breakdown,
		adjustments
	};
}

function getSimplePricingFactor(f: pricing.PricingFactorName, slot: AvailableSlot) {
	switch (f.name) {
		case 'daysUntilBooking':
			return { name: 'daysUntilBooking', value: isoDateFns.daysUntil(slot.serviceRequest.date) };
		case 'dayOfWeek':
			return { name: 'dayOfWeek', value: isoDateFns.dayOfWeek(slot.serviceRequest.date) };
		case 'bookingDate':
			return { name: 'bookingDate', value: slot.serviceRequest.date.value };
		case 'resourceMetadata':
			return {
				name: 'resourceMetadata',
				value: slot.resourceAllocation.map(ra => ({
					requirementId: ra.requirement.id.value,
					metadata: ra.resource.metadata
				}))
			};
		default:
			throw new Error(`Unknown required factor ${JSON.stringify(f)}`);
	}
}

export interface HourCountParams {
	startingTime: TwentyFourHourClockTime;
	endingTime: TwentyFourHourClockTime;
}

function getParameterisedPricingFactor(f: pricing.ParameterisedPricingFactor, slot: AvailableSlot): pricing.PricingFactor {
	if (f.type === 'hourCount') {
		const params = f.parameters as HourCountParams;
		const reportingPeriod = timePeriod(params.startingTime, params.endingTime);
		const servicePeriod = availableSlotFns.servicePeriod(slot);
		const overlap = timePeriodFns.overlap(reportingPeriod, servicePeriod);
		if (overlap === null) {
			return { name: f.name, value: 0 };
		}
		const overlapDuration = timePeriodFns.duration(overlap);
		return { name: f.name, value: minuteFns.toHours(durationFns.toMinutes(overlapDuration)) };
	}
	throw new Error(`Unknown required factor ${JSON.stringify(f)}`);
}

function factorsForSlot(requiredFactors: pricing.PricingFactorSpec[], slot: AvailableSlot): pricing.PricingFactor[] {
	return requiredFactors.map(f => {
		if (f._type === 'factor.name') {
			return getSimplePricingFactor(f, slot);
		}
		return getParameterisedPricingFactor(f, slot);
	});
}

interface PricingContext {
	serviceDurationMinutes: number;
}

function getPricingContext(slot: AvailableSlot): PricingContext {
	return {
		serviceDurationMinutes: durationFns.toMinutes(availableSlotFns.duration(slot)).value
	};
}

export function calculatePrice(slot: AvailableSlot, pricingRules: pricing.PricingRule[]): PricedSlot {
	const pricingEngine = new pricing.PricingEngine();
	pricingRules.forEach(r => pricingEngine.addRule(r));
	const requiredFactors = Array.from(new Set(pricingRules.flatMap(r => r.requiredFactors)));
	const pricingContext = getPricingContext(slot);
	const currency = slot.serviceRequest.service.price.currency;

	const servicePrice = pricingEngine.calculatePrice(pricing.price(slot.serviceRequest.service.price.amount.value), factorsForSlot(requiredFactors, slot), pricingContext);
	const pricedOptions = slot.serviceRequest.options.map(so => {
		const total = price(so.option.price.amount.value * so.quantity, currency);
		return pricedServiceOption(so.option.id, so.option.price, so.quantity, total);
	});
	const pricedAddOns = slot.serviceRequest.addOns.map(a => pricedAddOn(a.addOn.id, price(a.addOn.price.amount.value, currency), a.quantity, price(a.addOn.price.amount.value * a.quantity, currency)));
	const total = [
		servicePrice.finalPrice.amountInMinorUnits,
		...pricedAddOns.map(po => po.price.amount.value),
		...pricedOptions.map(po => po.price.amount.value)].reduce((acc, curr) => acc + curr, 0);
	const breakdown = priceBreakdown(price(servicePrice.finalPrice.amountInMinorUnits, currency), pricedAddOns, pricedOptions, price(total, slot.serviceRequest.service.price.currency));
	return pricedSlot(slot, breakdown, servicePrice.adjustments);
}
