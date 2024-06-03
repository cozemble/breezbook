import {EverythingForAvailability} from '../express/getEverythingForAvailability.js';
import {
    AddOn,
    AddOn as DomainAddOn,
    AvailableSlot,
    BookableTimes,
    calculateAvailability,
    calculatePrice,
    Form,
    IsoDate,
    mandatory,
    Price,
    PricingRule,
    ResourcedTimeSlot,
    Service,
    Service as DomainService,
    ServiceId,
    startTimeFns,
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
            "---",
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

export function applyPricingRules(availability: ResourcedTimeSlot[] | BookableTimes[], pricingRules: PricingRule[], services: Service[], addOns: AddOn[], forms: Form[], serviceId: ServiceId): AvailabilityResponse {
    const priced = availability.map((a) => {
        if (a._type === 'bookable.times') {
            return a;
        }
        return calculatePrice(a, pricingRules);
    });
    return priced.reduce(
        (acc, curr) => {
            if (curr._type === 'bookable.times') {
                // const timesForDate = acc.slots[curr.date.value] ?? [];
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
            getServiceSummary(services, serviceId, forms),
            getAddOnSummaries(services, addOns, serviceId)
        )
    );
}

export function getAvailabilityForService(
    everythingForAvailability: EverythingForAvailability,
    serviceId: ServiceId,
    fromDate: IsoDate,
    toDate: IsoDate
): AvailabilityResponse {
    const availability = calculateAvailability(
        everythingForAvailability.businessConfiguration,
        everythingForAvailability.bookings.filter((b) => b.status === 'confirmed'),
        serviceId,
        fromDate,
        toDate
    );
    return applyPricingRules(
        availability,
        everythingForAvailability.pricingRules,
        everythingForAvailability.businessConfiguration.services,
        everythingForAvailability.businessConfiguration.addOns,
        everythingForAvailability.businessConfiguration.forms,
        serviceId);
}

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
        description: ao.description,
        priceWithNoDecimalPlaces: ao.price.amount.value,
        priceCurrency: ao.price.currency.value,
        requiresQuantity: ao.requiresQuantity
    }));
}
