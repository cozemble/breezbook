import {
	AddOn as DomainAddOn,
	calculateAvailability,
	calculatePrice,
	Form,
	IsoDate,
	mandatory,
	Service as DomainService,
	ServiceId,
	values
} from '@breezbook/packages-core';
import express from 'express';
import { AddOnSummary, AvailabilityResponse, emptyAvailabilityResponse, ServiceSummary, timeSlotAvailability } from '../apiTypes.js';
import { date, query, serviceIdParam, tenantEnvironmentParam, withFourRequestParams } from '../infra/functionalExpress.js';
import { EverythingForTenant, getEverythingForTenant } from './getEverythingForTenant.js';

function getServiceSummary(services: DomainService[], serviceId: ServiceId, forms: Form[]): ServiceSummary {
	const service = mandatory(
		services.find((s) => s.id.value === serviceId.value),
		`Service with id ${serviceId.value} not found`
	);
	return {
		name: service.name,
		id: serviceId.value,
		durationMinutes: service.duration,
		description: service.description,
		forms: service.serviceFormIds.map((id) =>
			mandatory(
				forms.find((f) => values.isEqual(f.id, id)),
				`Form with id ${id.value} not found`
			)
		)
	};
}

function getAddOnSummaries(services: DomainService[], addOns: DomainAddOn[], serviceId: ServiceId): AddOnSummary[] {
	const service = mandatory(
		services.find((s) => s.id.value === serviceId.value),
		`Service with id ${serviceId.value} not found`
	);
	const permittedAddOns = service.permittedAddOns.map((ao) =>
		mandatory(
			addOns.find((a) => a.id.value === ao.value),
			`Add on with id ${ao.value} not found`
		)
	);
	return permittedAddOns.map((ao) => ({
		name: ao.name,
		id: ao.id.value,
		priceWithNoDecimalPlaces: ao.price.amount.value,
		priceCurrency: ao.price.currency.value,
		requiresQuantity: ao.requiresQuantity
	}));
}

export function getAvailabilityForService(
	everythingForTenant: EverythingForTenant,
	serviceId: ServiceId,
	fromDate: IsoDate,
	toDate: IsoDate
): AvailabilityResponse {
	const availability = calculateAvailability(everythingForTenant.businessConfiguration, everythingForTenant.bookings, serviceId, fromDate, toDate);
	const priced = availability.map((a) => {
		if (a._type === 'bookable.times') {
			return a;
		}
		return calculatePrice(a, everythingForTenant.pricingRules);
	});
	return priced.reduce(
		(acc, curr) => {
			if (curr._type === 'bookable.times') {
				throw new Error('Not yet implemented');
			}
			const slotsForDate = acc.slots[curr.slot.date.value] ?? [];
			const currTimeslot = timeSlotAvailability(
				curr.slot.slot.id.value,
				curr.slot.slot.slot.from.value,
				curr.slot.slot.slot.to.value,
				curr.slot.slot.description,
				curr.price.amount.value,
				curr.price.currency.value
			);
			if (!slotsForDate.some((a) => a.label === currTimeslot.label)) {
				slotsForDate.push(currTimeslot);
			}
			acc.slots[curr.slot.date.value] = slotsForDate;
			return acc;
		},
		emptyAvailabilityResponse(
			getServiceSummary(everythingForTenant.businessConfiguration.services, serviceId, everythingForTenant.businessConfiguration.forms),
			getAddOnSummaries(everythingForTenant.businessConfiguration.services, everythingForTenant.businessConfiguration.addOns, serviceId)
		)
	);
}

export async function getServiceAvailability(req: express.Request, res: express.Response): Promise<void> {
	await withFourRequestParams(
		req,
		res,
		tenantEnvironmentParam(),
		serviceIdParam(),
		date(query('fromDate')),
		date(query('toDate')),
		async (tenantEnvironment, serviceId, fromDate, toDate) => {
			console.log(
				`Getting availability for tenant ${tenantEnvironment.tenantId.value} and service ${serviceId.value} from ${fromDate.value} to ${toDate.value} in environment ${tenantEnvironment.environmentId.value}`
			);
			const everythingForTenant = await getEverythingForTenant(tenantEnvironment, fromDate, toDate);
			res.send(getAvailabilityForService(everythingForTenant, serviceId, fromDate, toDate));
		}
	);
}
