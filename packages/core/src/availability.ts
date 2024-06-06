import {
    availabilityBlock,
    Booking,
    BusinessAvailability,
    dayAndTimePeriod,
    DayAndTimePeriod,
    dayAndTimePeriodFns,
    ExactTimeAvailability,
    exactTimeAvailability,
    IsoDate,
    Resource,
    ResourceDayAvailability,
    resourceDayAvailabilityFns,
    ResourceId,
    ResourceRequirement,
    resourceRequirementFns,
    ResourceType,
    Service,
    ServiceOption,
    StartTimeSpec,
    time24Fns,
    TimePeriod,
    timePeriodFns,
    TimeslotSpec,
    TwentyFourHourClockTime
} from "./types.js";
import {errorResponse, ErrorResponse, mandatory, success, Success} from "./utils.js";
import {calcSlotPeriod} from "./calculateAvailability.js";

export type StartTime = TimeslotSpec | ExactTimeAvailability

export interface ResourceAllocation {
    _type: 'resource.allocation'
    requirement: ResourceRequirement
    resource: Resource
}

export function resourceAllocation(requirement: ResourceRequirement, resource: Resource): ResourceAllocation {
    return {
        _type: 'resource.allocation',
        requirement,
        resource
    }
}

export const startTimeFns = {
    toTime24(startTime: StartTime): TwentyFourHourClockTime {
        if (startTime._type === 'exact.time.availability') {
            return startTime.time
        }
        return startTime.slot.from
    }
}

export interface AvailableSlot {
    _type: 'available.slot'
    service: Service
    date: IsoDate
    startTime: StartTime
    resourceAllocation: ResourceAllocation[]
}

export function availableSlot(service: Service, date: IsoDate, startTime: StartTime, resourceAllocation: ResourceAllocation[]): AvailableSlot {
    return {
        _type: "available.slot",
        service,
        date,
        startTime,
        resourceAllocation
    }
}

function calcPossibleStartTimes(startTimeSpec: StartTimeSpec, availabilityForDay: DayAndTimePeriod[], service: Service): TwentyFourHourClockTime[] {
    if (startTimeSpec._type === 'periodic.start.time') {
        return availabilityForDay.flatMap(a => {
            const possibleStartTimes = timePeriodFns.listPossibleStartTimes(a.period, startTimeSpec.period)
            return possibleStartTimes.filter(time => time24Fns.addMinutes(time, service.duration).value <= a.period.to.value)
        })
    } else {
        return startTimeSpec.times
    }
}

interface FullyResourcedBooking {
    _type: 'fully.resourced.booking'
    booking: Booking
    resourceAllocation: ResourceAllocation[]
}

function fullyResourcedBooking(booking: Booking, resourceAllocation: ResourceAllocation[] = []): FullyResourcedBooking {
    return {
        _type: "fully.resourced.booking",
        booking,
        resourceAllocation
    }
}

function assignResourcesToBooking(booking: Booking, resources: ResourceDayAvailability[], service: Service): FullyResourcedBooking | ErrorResponse {
    const resourceOutcome = resourceRequirementFns.matchRequirements(resources, dayAndTimePeriod(booking.date, calcSlotPeriod(booking.slot, service.duration)), service.resourceRequirements)
    if (resourceOutcome._type === 'error.response') {
        return resourceOutcome
    }
    return fullyResourcedBooking(booking, resourceOutcome.value.map(r => resourceAllocation(r.requirement, r.match.resource)))
}


function subtractTimePeriod(period: DayAndTimePeriod, booking: Booking, service: Service): DayAndTimePeriod[] {
    if (period.day.value !== booking.date.value) {
        return [period]
    }
    const servicePeriod = calcSlotPeriod(booking.slot, service.duration)
    return dayAndTimePeriodFns.splitPeriod(period, dayAndTimePeriod(booking.date, servicePeriod))
}

function subtractCapacity(resourcedBooking: FullyResourcedBooking, r: ResourceDayAvailability, service: Service): ResourceDayAvailability {
    const assigned = mandatory(resourcedBooking.booking.assignedResources.find(assigned => assigned.resource.value === r.resource.id.value), `No assigned resource for resource '${r.resource.id.value}'`)
    return resourceDayAvailabilityFns.subtractCapacity(r, dayAndTimePeriod(resourcedBooking.booking.date, calcSlotPeriod(resourcedBooking.booking.slot, service.duration)), assigned.capacity)
}

function subtractResources(resourcedBooking: FullyResourcedBooking, remainingResources: ResourceDayAvailability[], service: Service): ResourceDayAvailability[] {
    return remainingResources.map(r => {
        if (resourcedBooking.resourceAllocation.some(alloc => alloc.resource.id.value === r.resource.id.value)) {
            if (r.resource.type.hasCapacity) {
                return subtractCapacity(resourcedBooking, r, service);
            } else {
                return {
                    ...r,
                    availability: r.availability.flatMap(a => subtractTimePeriod(a.when, resourcedBooking.booking, service).map(p => availabilityBlock(p, a.capacity)))
                }
            }
        }
        return r
    })
}

function calcActualResourceAvailability(resourceAvailability: ResourceDayAvailability[], bookings: Booking[], service: Service): ResourceDayAvailability[] | ErrorResponse {
    let remainingResources = resourceAvailability
    for (const booking of bookings) {
        const resourcedBookingOutcome = assignResourcesToBooking(booking, remainingResources, service)
        if (resourcedBookingOutcome._type === 'error.response') {
            return resourcedBookingOutcome
        }
        remainingResources = subtractResources(resourcedBookingOutcome, remainingResources, service)
    }
    return remainingResources
}

function resourcesAreAvailable(resourceTypes: ResourceType[], time: DayAndTimePeriod, actualAvailableResources: ResourceDayAvailability[]): boolean {
    return resourceTypes.every(resourceType =>
        actualAvailableResources.some(r =>
            r.resource.type.value === resourceType.value &&
            r.availability.some(a => dayAndTimePeriodFns.overlaps(dayAndTimePeriod(a.when.day, a.when.period), time))
        )
    );
}

function asTimePeriod(time: StartTime, service: Service): TimePeriod {
    if (time._type === "timeslot.spec") {
        return time.slot
    }
    return calcSlotPeriod(time, service.duration);
}

export interface AvailabilityConfiguration {
    _type: 'availability.configuration'
    availability: BusinessAvailability;
    resourceAvailability: ResourceDayAvailability[];
    timeslots: TimeslotSpec[];
    startTimeSpec: StartTimeSpec;
}

export function availabilityConfiguration(availability: BusinessAvailability, resourceAvailability: ResourceDayAvailability[], timeslots: TimeslotSpec[], startTimeSpec: StartTimeSpec): AvailabilityConfiguration {
    return {
        _type: "availability.configuration",
        availability,
        resourceAvailability,
        timeslots,
        startTimeSpec
    }
}

export interface ServiceRequest {
    _type: 'service.request'
    date: IsoDate;
    service: Service;
    options: ServiceOption[]
}

export function serviceRequest(service: Service, date: IsoDate, options: ServiceOption[] = []): ServiceRequest {
    return {
        _type: "service.request",
        date,
        service,
        options
    }
}

export const availability = {
    errorCodes: {
        noAvailabilityForDay: 'no.availability.for.day',
        noResourcesAvailable: 'no.resources.available',
        unresourceableBooking: 'unresourceable.booking'
    },
    calculateAvailableSlots: (config: AvailabilityConfiguration,
                              bookings: Booking[],
                              serviceRequest: ServiceRequest): Success<AvailableSlot[]> | ErrorResponse => {
        const service = serviceRequest.service
        const date = serviceRequest.date
        const availabilityForDay = config.availability.availability.filter(a => a.day.value === date.value)
        if (availabilityForDay.length === 0) {
            return errorResponse(availability.errorCodes.noAvailabilityForDay, `No availability for date '${date.value}'`)
        }
        const bookingsForDate = bookings.filter(b => b.date.value === date.value)
        const resourceAvailabilityOutcome = calcActualResourceAvailability(config.resourceAvailability, bookingsForDate, service)
        if (!Array.isArray(resourceAvailabilityOutcome)) {
            return resourceAvailabilityOutcome
        }
        const unavailableResourceTypes = service.resourceRequirements.filter(requirement => {
            if (requirement._type === 'any.suitable.resource') {
                return !resourceAvailabilityOutcome.some(r => r.resource.type.value === requirement.requirement.value)
            } else {
                return !resourceAvailabilityOutcome.some(r => r.resource.id.value === requirement.resource.id.value)
            }
        });

        if (unavailableResourceTypes.length > 0) {
            return errorResponse(availability.errorCodes.noResourcesAvailable, `Do not have resources for service '${service.id.value}'. Missing resource types: ${JSON.stringify(unavailableResourceTypes)}`)
        }

        const possibleStartTimes = service.startTimes ?? calcPossibleStartTimes(config.startTimeSpec, availabilityForDay, service).map(exactTimeAvailability);
        const startTimesWithResources = possibleStartTimes.filter(time => {
            const timePeriod = dayAndTimePeriod(date, asTimePeriod(time, service));
            const matched = resourceRequirementFns.matchRequirements(resourceAvailabilityOutcome, timePeriod, service.resourceRequirements);
            return matched._type === 'success';
        });

        return success(startTimesWithResources.map(t => availableSlot(service, date, t, [])));
    },
    calculateAvailableSlotsForResource: (config: AvailabilityConfiguration,
                                         bookings: Booking[],
                                         serviceRequest: ServiceRequest,
                                         resourceId: ResourceId): Success<AvailableSlot[]> | ErrorResponse => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: resourceDayAvailabilityFns.reduceToResource(config.resourceAvailability, resourceId)
        }
        return availability.calculateAvailableSlots(mutatedConfig, bookings.filter(b => b.assignedResources.some(rid => rid.resource.value === resourceId.value)), serviceRequest)
    }
}