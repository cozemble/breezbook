import {EverythingForAvailability} from '../express/getEverythingForAvailability.js';
import {
    AddOn,
    AddOn as DomainAddOn,
    addOnFns,
    availability,
    availabilityConfiguration,
    AvailabilityConfiguration,
    AvailableSlot,
    Booking,
    calculatePrice,
    errorResponse,
    ErrorResponse,
    mandatory,
    Price,
    PricedSlot,
    Service,
    Service as DomainService,
    serviceFns,
    serviceRequest,
    startTimeFns,
    success,
} from '@breezbook/packages-core';
import {
    AddOnSummary,
    AvailabilityResponse,
    emptyAvailabilityResponse,
    ServiceSummary,
    TimeSlotAvailability,
    timeSlotAvailability
} from '@breezbook/backend-api-types';
import {Form, IsoDate, isoDateFns, ServiceId, values} from "@breezbook/packages-types";

function toTimeSlotAvailability(slot: AvailableSlot, price: Price): TimeSlotAvailability {
    const startTime24 = startTimeFns.toTime24(slot.startTime)
    return timeSlotAvailability(
        startTime24.value,
        startTime24.value,
        slot.startTime._type === 'timeslot.spec' ? slot.startTime.slot.to.value : "---",
        startTime24.value,
        price.amount.value,
        price.currency.value
    );
}

function toAvailabilityResponse(priced: PricedSlot[], service: Service, addOns: AddOn[], forms: Form[]): AvailabilityResponse {
    return priced.reduce(
        (acc, curr) => {
            const slotsForDate = acc.slots[curr.slot.date.value] ?? [];
            const currTimeslot = toTimeSlotAvailability(curr.slot, curr.price);
            if (!slotsForDate.some((a) => a.label === currTimeslot.label)) {
                slotsForDate.push(currTimeslot);
            }
            acc.slots[curr.slot.date.value] = slotsForDate;
            return acc;
        },
        emptyAvailabilityResponse(
            getServiceSummary(service, forms),
            getAddOnSummaries(service, addOns)
        )
    );
}

export const getAvailabilityForServiceErrorCodes = {
    serviceUnavailable: 'service.unavailable'
}

export function getAvailabilityForService(
    everythingForAvailability: EverythingForAvailability,
    serviceId: ServiceId,
    fromDate: IsoDate,
    toDate: IsoDate
): AvailabilityResponse | ErrorResponse {
    const config = availabilityConfiguration(
        everythingForAvailability.businessConfiguration.availability,
        everythingForAvailability.businessConfiguration.resourceAvailability,
        everythingForAvailability.businessConfiguration.timeslots,
        everythingForAvailability.businessConfiguration.startTimeSpec);
    const service = serviceFns.maybeFindService(everythingForAvailability.businessConfiguration.services, serviceId);
    if (!service) {
        return errorResponse(getAvailabilityForServiceErrorCodes.serviceUnavailable, `Service with id ${serviceId.value} not found`);
    }
    const availability = getAvailableSlots(config, everythingForAvailability.bookings, service, fromDate, toDate)
    const priced = availability.map((a) => calculatePrice(a, everythingForAvailability.pricingRules))
    return toAvailabilityResponse(
        priced,
        service,
        everythingForAvailability.businessConfiguration.addOns,
        everythingForAvailability.businessConfiguration.forms);
}

function getAvailableSlots(config: AvailabilityConfiguration, bookings: Booking[], service: Service, fromDate: IsoDate, toDate: IsoDate): AvailableSlot[] {
    const dates = isoDateFns.listDays(fromDate, toDate);
    const eachDate = dates.map(date => {
        const outcome = availability.calculateAvailableSlots(config, bookings, serviceRequest(service, date));
        if (outcome._type === 'error.response' && outcome.errorCode === availability.errorCodes.noAvailabilityForDay) {
            return success([])
        }
        return outcome
    })
    const firstError = eachDate.find(r => r._type === 'error.response')
    if (firstError) {
        throw new Error((firstError as ErrorResponse).errorMessage)
    }
    return eachDate.flatMap(d => d._type === 'success' ? d.value : [])
}

function getServiceSummary(service: DomainService, forms: Form[]): ServiceSummary {
    return {
        name: service.name,
        id: service.id.value,
        durationMinutes: service.duration.value,
        description: service.description,
        forms: service.serviceFormIds.map((id) =>
            mandatory(
                forms.find((f) => values.isEqual(f.id, id)),
                `Form with id ${id.value} not found`
            )
        )
    };
}

function getAddOnSummaries(service: DomainService, addOns: DomainAddOn[]): AddOnSummary[] {
    const permittedAddOns = service.permittedAddOns.map((ao) => addOnFns.findById(addOns, ao))
    return permittedAddOns.map((ao) => ({
        name: ao.name,
        id: ao.id.value,
        description: ao.description,
        priceWithNoDecimalPlaces: ao.price.amount.value,
        priceCurrency: ao.price.currency.value,
        requiresQuantity: ao.requiresQuantity
    }));
}
