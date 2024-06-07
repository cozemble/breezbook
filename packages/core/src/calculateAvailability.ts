import {errorResponseFns, mandatory} from './utils.js';
import {applyBookingsToResourceAvailability, fitAvailability} from './applyBookingsToResourceAvailability.js';
import {
    availabilityBlock,
    BookableSlot,
    BookableTimes,
    bookableTimeSlot,
    Booking,
    BusinessAvailability,
    BusinessConfiguration,
    DayAndTimePeriod,
    dayAndTimePeriod,
    dayAndTimePeriodFns,
    discreteStartTimes,
    DiscreteStartTimes,
    exactTimeAvailability,
    ExactTimeAvailability,
    IsoDate,
    isoDateFns,
    PeriodicStartTime,
    Resource,
    ResourceDayAvailability,
    resourcedTimeSlot,
    ResourcedTimeSlot,
    ResourceId,
    resourceRequirementFns,
    ResourceType,
    Service,
    ServiceId,
    time24Fns,
    timePeriod,
    TimePeriod,
    timePeriodFns,
    TimeslotSpec,
    values
} from './types.js';

interface BookingWithResourceUsage {
    booking: Booking;
    resources: Resource[];
}

interface ResourceTimeSlot {
    resourceId: ResourceId;
    allocation: DayAndTimePeriod;
}

export function calcBookingPeriod(booking: Booking, serviceDuration: number): DayAndTimePeriod {
    return dayAndTimePeriod(booking.date, calcSlotPeriod(booking.slot, serviceDuration));
}

export function calcSlotPeriod(slot: BookableSlot, serviceDuration: number): TimePeriod {
    if (slot._type === 'exact.time.availability') {
        return timePeriod(slot.time, time24Fns.addMinutes(slot.time, serviceDuration));
    }
    return slot.slot;
}

function assignResourcesToBookings(config: BusinessConfiguration, bookings: Booking[]): BookingWithResourceUsage[] {
    return bookings.map((booking) => {
        const bookedService = booking.service;
        const serviceTime = calcBookingPeriod(booking, bookedService.duration);
        const resourceOutcome = resourceRequirementFns.matchRequirements(config.resourceAvailability, serviceTime, bookedService.resourceRequirements);
        if (resourceOutcome._type === 'error.response') {
            throw errorResponseFns.toError(resourceOutcome);
        }
        return {
            booking,
            resources: resourceOutcome.value.map(r => r.match.resource)
        }
    });
}

function applyBookedTimeSlotsToResourceAvailability(resourceAvailability: ResourceDayAvailability[], bookedSlot: ResourcedTimeSlot): ResourceDayAvailability[] {
    return resourceAvailability.map((ra) => {
        if (bookedSlot.resources.find((r) => values.isEqual(r.id, ra.resource.id))) {
            const slotPeriod = dayAndTimePeriod(bookedSlot.date, calcSlotPeriod(bookedSlot.slot, bookedSlot.service.duration))
            const newBlocks = ra.availability.flatMap(block => dayAndTimePeriodFns.splitPeriod(block.when, slotPeriod).map(p => availabilityBlock(p, block.capacity)))
            return {
                ...ra,
                availability: newBlocks
            } as ResourceDayAvailability;
        }
        return ra;
    });
}

function resourceTypesOnly(service: Service): ResourceType[] {
    return service.resourceRequirements.map((r) => {
        if (r._type === 'specific.resource') {
            throw new Error(`Specific resources are not supported in this context - refactoring this code away`)
        }
        return r.requirement;
    });
}

function calculateTimeslotAvailability(
    timeslots: TimeslotSpec[],
    service: Service,
    dates: IsoDate[],
    resourceAvailability: ResourceDayAvailability[]
): ResourcedTimeSlot[] {
    let collectedSlots: ResourcedTimeSlot[] = [];
    dates.forEach((date) => {
        const slotsForDay = timeslots.map((slot) => bookableTimeSlot(date, slot));
        for (const slotForDay of slotsForDay) {
            let resourcesMayRemain = true;
            while (resourcesMayRemain) {
                const resourcesForSlot = getAllResources(
                    resourceTypesOnly(service),
                    resourceAvailability,
                    dayAndTimePeriod(date, calcSlotPeriod(slotForDay.slot, service.duration))
                );
                if (resourcesForSlot && resourcesForSlot.length > 0) {
                    const bookedSlot = resourcedTimeSlot(slotForDay, resourcesForSlot, service);
                    collectedSlots.push(bookedSlot);
                    resourceAvailability = applyBookedTimeSlotsToResourceAvailability(resourceAvailability, bookedSlot);
                } else {
                    resourcesMayRemain = false;
                }
            }
        }
    });
    return collectedSlots;
}

function calcAllPossibleStartTimes(startTimeConfig: PeriodicStartTime, availability: BusinessAvailability, date: IsoDate): DiscreteStartTimes {
    const dayAvailability = availability.availability.find((a) => isoDateFns.sameDay(a.day, date));
    if (!dayAvailability) {
        throw new Error(`No availability for date ${date.value}`);
    }
    const times = timePeriodFns.listPossibleStartTimes(dayAvailability.period, startTimeConfig.period);
    return discreteStartTimes(times)
}

function calculatePeriodicStartTimes(startTimeConfig: PeriodicStartTime,
                                     config: BusinessConfiguration,
                                     date: IsoDate,
                                     bookingsWithResources: BookingWithResourceUsage[],
                                     service: Service
): ExactTimeAvailability[] {
    const allPossibleStartTimes = calcAllPossibleStartTimes(startTimeConfig, config.availability, date)
    return calculateDiscreteStartTimes(allPossibleStartTimes, config, date, bookingsWithResources, service)
}

function calculateDiscreteStartTimes(
    discreteStartTimes: DiscreteStartTimes,
    config: BusinessConfiguration,
    date: IsoDate,
    bookingsWithResources: BookingWithResourceUsage[],
    service: Service
): ExactTimeAvailability[] {
    const availableTimes = discreteStartTimes.times.filter((time) => {
            const has = hasResourcesForSlot(date, exactTimeAvailability(time), service, bookingsWithResources, config.resourceAvailability);
            return has
        }
    );
    return availableTimes.map((time) => exactTimeAvailability(time));
}

function calculateExactTimeAvailabilityForDate(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, date: IsoDate): BookableTimes {
    const bookingsWithResources = assignResourcesToBookings(config, bookingsInDateRange);
    const availableTimes =
        config.startTimeSpec._type === 'periodic.start.time'
            ? calculatePeriodicStartTimes(config.startTimeSpec, config, date, bookingsWithResources, service)
            : calculateDiscreteStartTimes(config.startTimeSpec, config, date, bookingsWithResources, service);
    return {
        _type: 'bookable.times',
        date,
        bookableTimes: availableTimes
    };
}

function calculateExactTimeAvailability(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, dates: IsoDate[]): BookableTimes[] {
    return dates.map((date) => calculateExactTimeAvailabilityForDate(config, bookingsInDateRange, service, date));
}

function hasResourcesForSlot(
    date: IsoDate,
    slot: BookableSlot,
    service: Service,
    bookingWithResourceUsage: BookingWithResourceUsage[],
    availableResources: ResourceDayAvailability[]
): boolean {
    const slotDayAndTime = dayAndTimePeriod(date, calcSlotPeriod(slot, service.duration));
    const resourcesUsedDuringSlot = bookingWithResourceUsage
        .filter((r) => dayAndTimePeriodFns.overlaps(calcBookingPeriod(r.booking, service.duration), slotDayAndTime))
        .flatMap((r) => r.resources);
    const availableResourcesForSlot = availableResources.filter((ra) => ra.availability.some((da) => dayAndTimePeriodFns.overlaps(da.when, slotDayAndTime)));
    const resourcesTypesAvailable = availableResourcesForSlot
        .map((a) => a.resource)
        .filter((r) => !resourcesUsedDuringSlot.find((used) => values.isEqual(used.id, r.id)))
        .map((r) => r.type);
    return resourceTypesOnly(service).every((rt) => resourcesTypesAvailable.find((rta) => values.isEqual(rta, rt)));
}

function getResource(availabilities: ResourceDayAvailability[], resourceType: ResourceType, period: DayAndTimePeriod): Resource | null {
    const availableResources = availabilities.filter((ra) => values.isEqual(ra.resource.type, resourceType));
    const availableResource = availableResources.find((ra) => ra.availability.some((da) => dayAndTimePeriodFns.overlaps(da.when, period)));
    return availableResource ? availableResource.resource : null;
}

function getAllResources(resourceTypes: ResourceType[], availabilities: ResourceDayAvailability[], period: DayAndTimePeriod): Resource[] | null {
    const resources: Resource[] = [];
    resourceTypes.forEach((rt) => {
        const resource = getResource(availabilities, rt, period);
        if (resource) {
            resources.push(resource);
        } else {
            return null;
        }
    });
    return resources;
}

export function calculateAvailability(
    config: BusinessConfiguration,
    bookings: Booking[],
    serviceId: ServiceId,
    fromDate: IsoDate,
    toDate: IsoDate
): ResourcedTimeSlot[] | BookableTimes[] {
    const service = mandatory(
        config.services.find((s) => s.id.value === serviceId.value),
        `Service with id ${serviceId.value} not found`
    );
    const bookingsInDateRange = bookings.filter((b) => b.date >= fromDate && b.date <= toDate);
    const dates = isoDateFns.listDays(fromDate, toDate);
    const actualResourceAvailability = fitAvailability(
        applyBookingsToResourceAvailability(config.resourceAvailability, bookingsInDateRange),
        config.availability.availability
    );
    if (service.startTimes) {
        return calculateTimeslotAvailability(service.startTimes as TimeslotSpec[], service, dates, actualResourceAvailability);
    }
    return calculateExactTimeAvailability(config, bookingsInDateRange, service, dates);
}
