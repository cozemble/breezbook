import {mandatory} from "./utils.js";
import {applyBookingsToResourceAvailability, fitAvailability} from "./applyBookingsToResourceAvailability.js";
import {
    BookableSlot,
    BookableTimes,
    bookableTimeSlot,
    bookedTimeSlot,
    BookedTimeSlot,
    Booking,
    BusinessConfiguration,
    DayAndTimePeriod,
    dayAndTimePeriod,
    dayAndTimePeriodFns,
    DiscreteStartTimes,
    exactTimeAvailability,
    ExactTimeAvailability,
    isoDate,
    IsoDate,
    isoDateFns,
    Resource,
    ResourceDayAvailability,
    ResourceId,
    ResourceType,
    Service,
    ServiceId,
    time24Fns,
    timePeriod,
    TimePeriod,
    TimeslotSpec,
    values
} from "./types.js";

interface BookingWithResourceUsage {
    booking: Booking;
    resources: Resource[]
}

interface ResourceTimeSlot {
    resourceId: ResourceId;
    allocation: DayAndTimePeriod
}

function listDays(fromDate: IsoDate, toDate: IsoDate) {
    const from = new Date(fromDate.value);
    const to = new Date(toDate.value);
    const dates: IsoDate[] = [];
    for (let date = from; date <= to; date.setDate(date.getDate() + 1)) {
        dates.push(isoDate(date.toISOString().split('T')[0]));
    }
    return dates;
}

export function calcBookingPeriod(booking: Booking, serviceDuration: number): DayAndTimePeriod {
    return dayAndTimePeriod(booking.date, calcSlotPeriod(booking.slot, serviceDuration));
}

function calcSlotPeriod(slot: BookableSlot, serviceDuration: number): TimePeriod {
    if (slot._type === 'exact.time.availability') {
        return timePeriod(slot.time, time24Fns.addMinutes(slot.time, serviceDuration));
    }
    return slot.slot;
}


function assignResourcesToBookings(config: BusinessConfiguration, bookings: Booking[]): BookingWithResourceUsage[] {
    const resourceTimeSlots: ResourceTimeSlot[] = [];
    return bookings.map(booking => {
        const bookedService = mandatory(config.services.find(s => values.isEqual(s.id, booking.serviceId)), `Service with id ${booking.serviceId.value} not found`);
        const serviceTime = calcBookingPeriod(booking, bookedService.duration);
        const bookedResources = bookedService.resourceTypes.map((rt: ResourceType) => {
            const possibleResources = config.resourceAvailability.filter(ra => ra.availability.some(da => dayAndTimePeriodFns.overlaps(da, serviceTime))).map(a => a.resource);
            const resource = possibleResources.find(r => !resourceTimeSlots.find(rts => dayAndTimePeriodFns.overlaps(rts.allocation, serviceTime) && values.isEqual(rts.resourceId, r.id)));
            if (!resource) {
                throw new Error(`No resource of type '${rt.value}' available for booking ${booking.id.value}`);
            }
            resourceTimeSlots.push({
                resourceId: resource.id,
                allocation: serviceTime
            });
            return resource;
        })
        return {
            booking,
            resources: bookedResources,
        }
    })

}

function applyBookedTimeSlotsToResourceAvailability(resourceAvailability: ResourceDayAvailability[], bookedSlot: BookedTimeSlot, service: Service): ResourceDayAvailability[] {
    return resourceAvailability.map(resource => {
        if (bookedSlot.resources.find(r => values.isEqual(r.id, resource.resource.id))) {
            return {
                ...resource,
                availability: resource.availability.flatMap(da => {
                    if (isoDateFns.sameDay(da.day, bookedSlot.date)) {
                        return dayAndTimePeriodFns.splitPeriod(da, dayAndTimePeriod(bookedSlot.date, calcSlotPeriod(bookedSlot.slot, service.duration)));
                    }
                    return [da];
                })
            }
        }
        return resource;
    })
}

function calculateTimeslotAvailability(timeslots: TimeslotSpec[], service: Service, dates: IsoDate[], resourceAvailability: ResourceDayAvailability[]): BookedTimeSlot[] {
    let collectedSlots: BookedTimeSlot[] = [];
    dates.forEach(date => {
        const slotsForDay = timeslots.map(slot => bookableTimeSlot(date, slot));
        for (const slotForDay of slotsForDay) {
            let resourcesMayRemain = true
            while (resourcesMayRemain) {
                const resourcesForSlot = getAllResources(service.resourceTypes, resourceAvailability, dayAndTimePeriod(date, calcSlotPeriod(slotForDay.slot, service.duration)));
                if (resourcesForSlot && resourcesForSlot.length > 0) {
                    const bookedSlot = bookedTimeSlot(slotForDay, resourcesForSlot);
                    collectedSlots.push(bookedSlot);
                    resourceAvailability = applyBookedTimeSlotsToResourceAvailability(resourceAvailability, bookedSlot, service);
                } else {
                    resourcesMayRemain = false;
                }
            }
        }
    })
    return collectedSlots
}

function calculatePeriodicStartTimes(): ExactTimeAvailability[] {
    return []
}

function calculateDiscreteStartTimes(discreteStartTimes: DiscreteStartTimes, config: BusinessConfiguration, date: IsoDate, bookingsWithResources: BookingWithResourceUsage[], service: Service): ExactTimeAvailability[] {
    const availableTimes = discreteStartTimes.times.filter(time => hasResourcesForSlot(date, exactTimeAvailability(time), service, bookingsWithResources, config.resourceAvailability));
    return availableTimes.map(time => exactTimeAvailability(time));
}

function calculateExactTimeAvailabilityForDate(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, date: IsoDate): BookableTimes {
    const bookingsWithResources = assignResourcesToBookings(config, bookingsInDateRange);
    const availableTimes = config.startTimeSpec._type === 'periodic.start.time' ? calculatePeriodicStartTimes() : calculateDiscreteStartTimes(config.startTimeSpec, config, date, bookingsWithResources, service);
    return {
        date,
        bookableTimes: availableTimes
    };

}

function calculateExactTimeAvailability(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, dates: IsoDate[]): BookableTimes[] {
    return dates.map(date => calculateExactTimeAvailabilityForDate(config, bookingsInDateRange, service, date));
}

export function calculateAvailability(config: BusinessConfiguration, bookings: Booking[], serviceId: ServiceId, fromDate: IsoDate, toDate: IsoDate): BookedTimeSlot[] | BookableTimes[] {
    const service = mandatory(config.services.find(s => s.id.value === serviceId.value), `Service with id ${serviceId.value} not found`);
    const bookingsInDateRange = bookings.filter(b => b.date >= fromDate && b.date <= toDate);
    const dates = listDays(fromDate, toDate);
    const actualResourceAvailability = fitAvailability(applyBookingsToResourceAvailability(config.resourceAvailability, bookingsInDateRange, config.services), config.availability.availability);
    if (service.requiresTimeslot) {
        return calculateTimeslotAvailability(config.timeslots, service, dates, actualResourceAvailability);
    }
    return calculateExactTimeAvailability(config, bookingsInDateRange, service, dates);
}

function hasResourcesForSlot(date: IsoDate, slot: BookableSlot, service: Service, bookingWithResourceUsage: BookingWithResourceUsage[], availableResources: ResourceDayAvailability[]): boolean {
    const slotDayAndTime = dayAndTimePeriod(date, calcSlotPeriod(slot, service.duration))
    const resourcesUsedDuringSlot = bookingWithResourceUsage
        .filter(r => dayAndTimePeriodFns.overlaps(calcBookingPeriod(r.booking, service.duration), slotDayAndTime))
        .flatMap(r => r.resources);
    const availableResourcesForSlot = availableResources.filter(ra => ra.availability.some(da => dayAndTimePeriodFns.overlaps(da, slotDayAndTime)));
    const resourcesTypesAvailable = availableResourcesForSlot
        .map(a => a.resource)
        .filter(r => !resourcesUsedDuringSlot.find(used => values.isEqual(used.id, r.id)))
        .map(r => r.type);
    return service.resourceTypes.every(rt => resourcesTypesAvailable.find(rta => values.isEqual(rta, rt)));
}

function getResource(availabilities: ResourceDayAvailability[], resourceType: ResourceType, period: DayAndTimePeriod): Resource | null {
    const availableResources = availabilities.filter(ra => values.isEqual(ra.resource.type, resourceType));
    const availableResource = availableResources.find(ra => ra.availability.some(da => dayAndTimePeriodFns.overlaps(da, period)));
    return availableResource ? availableResource.resource : null;
}

function getAllResources(resourceTypes: ResourceType[], availabilities: ResourceDayAvailability[], period: DayAndTimePeriod): Resource[] | null {
    const resources: Resource[] = [];
    resourceTypes.forEach(rt => {
        const resource = getResource(availabilities, rt, period);
        if (resource) {
            resources.push(resource);
        } else {
            return null
        }
    })
    return resources;
}
