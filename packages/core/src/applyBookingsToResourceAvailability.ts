import {errorResponseFns} from "./utils.js";
import {
    availabilityBlock,
    AvailabilityBlock,
    Booking,
    DayAndTimePeriod,
    dayAndTimePeriodFns,
    isoDateFns,
    ResourceDayAvailability,
    resourceRequirementFns,
    values
} from "./types.js";
import {calcBookingPeriod} from "./calculateAvailability.js";

export function applyBookingsToResourceAvailability(resourceAvailability: ResourceDayAvailability[], bookings: Booking[]): ResourceDayAvailability[] {
    return bookings.reduce((resourceAvailability, booking) => {
        const service = booking.service;
        const bookingPeriod = calcBookingPeriod(booking, service.duration);
        const resourceOutcome = resourceRequirementFns.matchRequirements(resourceAvailability, bookingPeriod, service.resourceRequirements);
        if (resourceOutcome._type === 'error.response') {
            throw errorResponseFns.toError(resourceOutcome)
        }
        const firstSuitableResources = resourceOutcome.value
        return resourceAvailability.map(ra => {
            if (firstSuitableResources.find(r => values.isEqual(r.match.resource.id, ra.resource.id))) {
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
    const periods = fitTimesForDay.map(bh => {
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