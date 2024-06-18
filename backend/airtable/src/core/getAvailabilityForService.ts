import {EverythingForAvailability} from '../express/getEverythingForAvailability.js';
import {
    AddOn,
    AddOn as DomainAddOn,
    availability,
    availabilityConfiguration,
    AvailabilityConfiguration,
    AvailableSlot,
    BookableTimes,
    Booking,
    calculatePrice,
    ErrorResponse,
    Form,
    IsoDate,
    isoDateFns,
    mandatory,
    Price,
    PricingRule,
    ResourcedTimeSlot,
    Service,
    Service as DomainService,
    ServiceId,
    serviceRequest,
    startTimeFns,
    success,
    values
} from '@breezbook/packages-core';
import {
    AddOnSummary,
    AvailabilityResponse,
    emptyAvailabilityResponse,
    ServiceSummary,
    TimeSlotAvailability,
    timeSlotAvailability
} from '@breezbook/backend-api-types';

function toTimeSlotAvailability(slot: ResourcedTimeSlot | AvailableSlot, price: Price): TimeSlotAvailability {
    if (slot._type === 'available.slot') {
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
    return timeSlotAvailability(
        slot.slot.id.value,
        slot.slot.slot.from.value,
        slot.slot.slot.to.value,
        slot.slot.description,
        price.amount.value,
        price.currency.value
    );
}

export function applyPricingRules(availability: ResourcedTimeSlot[] | BookableTimes[] | AvailableSlot[], pricingRules: PricingRule[], service: Service, addOns: AddOn[], forms: Form[]): AvailabilityResponse {
    const priced = availability.map((a) => {
        if (a._type === 'bookable.times') {
            return a;
        }
        return calculatePrice(a, pricingRules);
    });
    return priced.reduce(
        (acc, curr) => {
            if (curr._type === 'bookable.times') {
                throw new Error('Not yet implemented');
            }
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

export function getAvailabilityForService2(
    everythingForAvailability: EverythingForAvailability,
    serviceId: ServiceId,
    fromDate: IsoDate,
    toDate: IsoDate
): AvailabilityResponse {
    const config = availabilityConfiguration(
        everythingForAvailability.businessConfiguration.availability,
        everythingForAvailability.businessConfiguration.resourceAvailability,
        everythingForAvailability.businessConfiguration.timeslots,
        everythingForAvailability.businessConfiguration.startTimeSpec);
    const service = mandatory(everythingForAvailability.businessConfiguration.services.find((s) => s.id.value === serviceId.value), `Service with id ${serviceId.value} not found`);
    const availability = getAvailableSlots(config, everythingForAvailability.bookings, service, fromDate, toDate)
    return applyPricingRules(
        availability,
        everythingForAvailability.pricingRules,
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
    const permittedAddOns = service.permittedAddOns.map((ao) =>
        mandatory(
            addOns.find((a) => a.id.value === ao.value),
            `Add on with id ${ao.value} not found`
        )
    );
    return permittedAddOns.map((ao) => ({
        name: ao.name,
        id: ao.id.value,
        description: ao.description,
        priceWithNoDecimalPlaces: ao.price.amount.value,
        priceCurrency: ao.price.currency.value,
        requiresQuantity: ao.requiresQuantity
    }));
}
