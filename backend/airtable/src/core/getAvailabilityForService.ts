import {EverythingForAvailability} from '../express/getEverythingForAvailability.js';
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
    PricedSlot,
    Service,
    serviceFns,
    serviceOptionAndQuantity,
    ServiceOptionAndQuantity,
    serviceOptionFns,
    serviceRequest,
    startTimeFns,
    success,
} from '@breezbook/packages-core';
import {
    AvailabilityResponse,
    emptyAvailabilityResponse,
    PriceBreakdown,
    TimeSlotAvailability,
    timeSlotAvailability
} from '@breezbook/backend-api-types';
import {IsoDate, isoDateFns} from "@breezbook/packages-types";
import {ServiceAvailabilityRequest} from "../express/availability/getServiceAvailabilityForLocation.js";

function toTimeSlotAvailability(priced: PricedSlot): TimeSlotAvailability {
    const slot = priced.slot;
    const price = priced.price;
    const startTime24 = startTimeFns.getStartTime(slot.startTime)
    const breakDown: PriceBreakdown = {
        total: priced.breakdown.total.amount.value,
        currency: priced.breakdown.total.currency.value,
        servicePrice: priced.breakdown.servicePrice.amount.value,
        pricedAddOns: priced.breakdown.pricedAddOns.map(po => ({
            addOnId: po.addOnId.value,
            unitPrice: po.price.amount.value,
            quantity: po.quantity,
            price: po.price.amount.value
        })),
        pricedOptions: priced.breakdown.pricedOptions.map(po => ({
            serviceOptionId: po.serviceOptionId.value,
            unitPrice: po.unitPrice.amount.value,
            quantity: po.quantity,
            price: po.price.amount.value
        }))
    }
    return timeSlotAvailability(
        startTime24.value,
        slot.serviceRequest.date.value,
        startTime24.value,
        slot.startTime._type === 'timeslot.spec' ? slot.startTime.slot.to.value : "---",
        startTime24.value,
        price.amount.value,
        price.currency.value,
        breakDown
    );
}

function toAvailabilityResponse(priced: PricedSlot[], service: Service): AvailabilityResponse {
    return priced.reduce(
        (acc, curr) => {
            const slotsForDate = acc.slots[curr.slot.serviceRequest.date.value] ?? [];
            const currTimeslot = toTimeSlotAvailability(curr);
            if (!slotsForDate.some((a) => a.label === currTimeslot.label)) {
                slotsForDate.push(currTimeslot);
            }
            acc.slots[curr.slot.serviceRequest.date.value] = slotsForDate;
            return acc;
        },
        emptyAvailabilityResponse(service.id.value)
    );
}

export const getAvailabilityForServiceErrorCodes = {
    serviceUnavailable: 'service.unavailable'
}

export function getAvailabilityForService(
    everythingForAvailability: EverythingForAvailability,
    request: ServiceAvailabilityRequest
): AvailabilityResponse | ErrorResponse {
    const {serviceId, fromDate, toDate, serviceOptionRequests, addOns} = request;
    const config = availabilityConfiguration(
        everythingForAvailability.businessConfiguration.availability,
        everythingForAvailability.businessConfiguration.resourceAvailability,
        everythingForAvailability.businessConfiguration.timeslots,
        everythingForAvailability.businessConfiguration.startTimeSpec,
        everythingForAvailability.businessConfiguration.serviceAvailability);
    const service = serviceFns.maybeFindService(everythingForAvailability.businessConfiguration.services, serviceId);
    if (!service) {
        return errorResponse(getAvailabilityForServiceErrorCodes.serviceUnavailable, `Service with id ${serviceId.value} not found`);
    }
    const serviceOptions = serviceOptionRequests.map((id) =>
        serviceOptionAndQuantity(serviceOptionFns.findServiceOption(everythingForAvailability.businessConfiguration.serviceOptions, id.serviceOptionId), id.quantity));
    const mappedAddOns = addOns.map((id) => addOnAndQuantity(addOnFns.findById(everythingForAvailability.businessConfiguration.addOns, id.addOnId), id.quantity));
    const availability = getAvailableSlots(config, everythingForAvailability.bookings, service, mappedAddOns, serviceOptions, fromDate, toDate)
    const priced = availability.map((a) => calculatePrice(a, everythingForAvailability.pricingRules))
    return toAvailabilityResponse(priced, service);
}

function getAvailableSlots(config: AvailabilityConfiguration, bookings: Booking[], service: Service, addOns: AddOnAndQuantity[], serviceOptions: ServiceOptionAndQuantity[], fromDate: IsoDate, toDate: IsoDate): AvailableSlot[] {
    const dates = isoDateFns.listDays(fromDate, toDate);
    const eachDate = dates.map(date => {
        const outcome = availability.calculateAvailableSlots(config, bookings, serviceRequest(service, date, addOns, serviceOptions));
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