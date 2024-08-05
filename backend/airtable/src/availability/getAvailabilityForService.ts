import { EverythingForAvailability } from '../express/getEverythingForAvailability.js';
import {
	addOnAndQuantity,
	AddOnAndQuantity,
	addOnFns,
	availability,
	availabilityConfiguration,
	AvailabilityConfiguration,
	AvailableSlot,
	Booking,
	calculatePrice,
	errorResponse,
	ErrorResponse,
	Service,
	serviceFns,
	serviceOptionAndQuantity,
	ServiceOptionAndQuantity,
	serviceOptionFns,
	serviceRequest,
	success
} from '@breezbook/packages-core';
import { AvailabilityResponse } from '@breezbook/backend-api-types';
import { byId } from '@breezbook/packages-types';
import { dayAndTimeFns, IsoDate, isoDateFns } from '@breezbook/packages-date-time';
import { ServiceAvailabilityRequest } from '../express/availability/getServiceAvailabilityForLocation.js';
import { toAvailabilityResponse } from './toAvailabilityResponse.js';

export const getAvailabilityForServiceErrorCodes = {
	serviceUnavailable: 'service.unavailable'
};

export function getAvailabilityForService(
	everythingForAvailability: EverythingForAvailability,
	request: ServiceAvailabilityRequest
): AvailabilityResponse | ErrorResponse {
	const { serviceId, fromDate, toDate, serviceOptionRequests, addOns } = request;
	const config = availabilityConfiguration(
		everythingForAvailability.businessConfiguration.availability,
		everythingForAvailability.businessConfiguration.resourceAvailability,
		everythingForAvailability.businessConfiguration.timeslots,
		everythingForAvailability.businessConfiguration.startTimeSpec, everythingForAvailability.locationTimezone);
	let service = serviceFns.maybeFindService(everythingForAvailability.businessConfiguration.services, serviceId);
	if (!service) {
		return errorResponse(getAvailabilityForServiceErrorCodes.serviceUnavailable, `Service with id ${serviceId.value} not found`);
	}
	service = request.requirementOverrides.reduce((acc, ro) => {
		return serviceFns.makeRequirementSpecific(acc, ro.requirementId, byId.find(everythingForAvailability.businessConfiguration.resources, ro.resourceId));
	}, service);

	const serviceOptions = serviceOptionRequests.map((id) =>
		serviceOptionAndQuantity(serviceOptionFns.findServiceOption(everythingForAvailability.businessConfiguration.serviceOptions, id.serviceOptionId), id.quantity));
	const mappedAddOns = addOns.map((id) => addOnAndQuantity(addOnFns.findById(everythingForAvailability.businessConfiguration.addOns, id.addOnId), id.quantity));
	const availability = getAvailableSlots(config, everythingForAvailability.bookings, service, mappedAddOns, serviceOptions, fromDate, toDate);
	const priced = availability.map((a) => calculatePrice(a, everythingForAvailability.pricingRules));
	return toAvailabilityResponse(priced, service.id, everythingForAvailability.locationTimezone);
}

function getAvailableSlots(config: AvailabilityConfiguration, bookings: Booking[], service: Service, addOns: AddOnAndQuantity[], serviceOptions: ServiceOptionAndQuantity[], fromDate: IsoDate, toDate: IsoDate): AvailableSlot[] {
	const dates = isoDateFns.listDays(fromDate, toDate);
	const now = dayAndTimeFns.now(config.locationTimezone);
	const eachDate = dates.map(date => {
		const outcome = availability.calculateAvailableSlots(config, bookings, serviceRequest(service, date, addOns, serviceOptions), now);
		if (outcome._type === 'error.response' && outcome.errorCode === availability.errorCodes.noAvailabilityForDay) {
			return success([]);
		}
		return outcome;
	});
	const firstError = eachDate.find(r => r._type === 'error.response');
	if (firstError) {
		throw new Error((firstError as ErrorResponse).errorMessage);
	}
	return eachDate.flatMap(d => d._type === 'success' ? d.value : []);
}