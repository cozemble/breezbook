import {mandatory} from "./utils.js";
import {
    availabilityBlock,
    AvailabilityBlock,
    Booking,
    DayAndTimePeriod,
    dayAndTimePeriodFns,
    isoDateFns,
    ResourceDayAvailability,
    Service,
    values
} from "./types.js";
import {calcBookingPeriod} from "./calculateAvailability.js";

export function applyBookingsToResourceAvailability(resourceAvailability: ResourceDayAvailability[], bookings: Booking[], services: Service[]): ResourceDayAvailability[] {
    return bookings.reduce((resourceAvailability, booking) => {
        const service = mandatory(services.find(s => values.isEqual(s.id, booking.serviceId)), `Service with id ${booking.serviceId.value} not found`);
        const bookingPeriod = calcBookingPeriod(booking, service.duration);
        const firstSuitableResources = service.resourceTypes.map(rt => {
            const availableResources = resourceAvailability.filter(ra => ra.resource.type.value === rt.value);
            const availableResource = availableResources.find(ra => ra.availability.some(da => dayAndTimePeriodFns.overlaps(da.when, bookingPeriod)));
            if (!availableResource) {
                throw new Error(`No resource of type '${rt.value}' available for booking ${booking.id.value}`);
            }
            return availableResource;
        })
        return resourceAvailability.map(ra => {
            if (firstSuitableResources.find(r => values.isEqual(r.resource.id, ra.resource.id))) {
                const amendedPeriods = ra.availability.flatMap(block => dayAndTimePeriodFns.splitPeriod(block.when, bookingPeriod).map(p => availabilityBlock(p, block.capacity)))
                return {
                    ...ra,
                    availability: amendedPeriods
                }
            }
            return ra;
        })
    }, resourceAvailability);
}

function fitTime(block: AvailabilityBlock, fitTimes: DayAndTimePeriod[]): AvailabilityBlock[] {
    const fitTimesForDay = fitTimes.filter(bh => isoDateFns.isEqual(bh.day, block.when.day))
    if (fitTimesForDay.length === 0) {
        return [];
    }
    const periods =  fitTimesForDay.map(bh => {
        if (dayAndTimePeriodFns.intersects(bh, block.when)) {
            return dayAndTimePeriodFns.intersection(bh, block.when);
        }
        return undefined;
    }).filter(bh => bh !== undefined) as DayAndTimePeriod[];
    return periods.map(p => availabilityBlock(p, block.capacity));
}

export function fitAvailability(resourceAvailability: ResourceDayAvailability[], fitTimes: DayAndTimePeriod[]): ResourceDayAvailability[] {
    return resourceAvailability.map(ra => {
        return {
            ...ra,
            availability: ra.availability.flatMap(datp => fitTime(datp, fitTimes))
        }
    })
}