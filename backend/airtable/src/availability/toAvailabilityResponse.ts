import {PricedSlot} from "@breezbook/packages-core";
import {
    AvailabilityResponse,
    emptyAvailabilityResponse,
    PriceBreakdown,
    timeSlotAvailability,
    TimeSlotAvailability
} from "@breezbook/backend-api-types";
import {ServiceId} from "@breezbook/packages-types";

function toTimeSlotAvailability(priced: PricedSlot): TimeSlotAvailability {
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
    const slot = priced.slot;
    const startTime = slot.startTime

    if (startTime._type === "timeslot.spec") {
        return timeSlotAvailability(
            startTime.slot.from.value,
            slot.serviceRequest.date.value,
            startTime.slot.from.value,
            startTime.slot.to.value,
            startTime.description,
            priced.price.amount.value,
            priced.price.currency.value,
            breakDown
        );
    }
    return timeSlotAvailability(
        startTime.time.value,
        slot.serviceRequest.date.value,
        startTime.time.value,
        "---",
        startTime.time.value,
        priced.price.amount.value,
        priced.price.currency.value,
        breakDown
    );
}

export function toAvailabilityResponse(priced: PricedSlot[], serviceId: ServiceId): AvailabilityResponse {
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
        emptyAvailabilityResponse(serviceId.value)
    );
}