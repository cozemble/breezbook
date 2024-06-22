import {
    Booking,
    bookingFns,
    BusinessAvailability,
    dayAndTimePeriod,
    DayAndTimePeriod,
    dayAndTimePeriodFns,
    ExactTimeAvailability,
    exactTimeAvailability,
    IsoDate,
    minuteFns,
    minutes,
    Resource,
    ResourceDayAvailability,
    resourceDayAvailabilityFns,
    ResourceRequirement,
    resourceRequirementFns,
    Service,
    ServiceOption,
    StartTimeSpec,
    time24Fns,
    timePeriod,
    TimePeriod,
    timePeriodFns,
    TimeslotSpec,
    TwentyFourHourClockTime
} from "./types.js";
import {errorResponse, ErrorResponse, errorResponseFns, mandatory, success, Success} from "./utils.js";

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
    if (resourceAllocation.length !== service.resourceRequirements.length) {
        throw new Error(`Resource allocation count mismatch for service '${service.id.value}' - expected ${service.resourceRequirements.length} got ${resourceAllocation.length}`)
    }
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

export function fullyResourcedBooking(booking: Booking, resourceAllocation: ResourceAllocation[] = []): FullyResourcedBooking {
    return {
        _type: "fully.resourced.booking",
        booking,
        resourceAllocation
    }
}

export const fullyResourcedBookingFns = {
    maxResourceUsage(resourcedBookings: FullyResourcedBooking[]): Map<Resource, number> {
        const resourcePeriods: Map<Resource, TimePeriod[]> = new Map<Resource, TimePeriod[]>()
        return resourcedBookings.reduce((acc, resourcedBooking) => {
            resourcedBooking.resourceAllocation.forEach(alloc => {
                const resource = alloc.resource
                if (!acc.get(resource)) {
                    acc.set(resource, resourcedBooking.booking.bookedCapacity.value)
                }
                const overlapsExistingPeriod = (resourcePeriods.get(resource) ?? []).some(existingPeriod => timePeriodFns.intersects(existingPeriod, resourcedBooking.booking.period))
                if (overlapsExistingPeriod) {
                    const count = mandatory(acc.get(resource), `No count for resource '${resource.id.value}'`)
                    acc.set(resource, count + resourcedBooking.booking.bookedCapacity.value)
                }
                const periods = resourcePeriods.get(resource) ?? []
                resourcePeriods.set(resource, [...periods, resourcedBooking.booking.period])
            })
            return acc
        }, new Map<Resource, number>())
    }
}

function assignResourcesToBooking(booking: Booking, resources: ResourceDayAvailability[]): FullyResourcedBooking | ErrorResponse {
    const resourceOutcome = resourceRequirementFns.matchRequirements(resources, bookingFns.calcPeriod(booking), booking.service.resourceRequirements, booking.fixedResourceAllocation)
    if (resourceOutcome._type === 'error.response') {
        return resourceOutcome
    }
    return fullyResourcedBooking(booking, resourceOutcome.value.map(r => resourceAllocation(r.requirement, r.match.resource)))
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

function toPeriod(date: IsoDate, possibleStartTime: StartTime, service: Service): DayAndTimePeriod {
    if (possibleStartTime._type === 'timeslot.spec') {
        return dayAndTimePeriod(date, possibleStartTime.slot)
    }
    return dayAndTimePeriod(date, timePeriod(possibleStartTime.time, time24Fns.addMinutes(possibleStartTime.time, service.duration)))
}

function toService(serviceRequest: ServiceRequest): Service {
    const duration = [serviceRequest.service.duration, ...serviceRequest.options.map(o => o.duration.value)].reduce((acc, d) => minuteFns.sum(acc, d), minutes(0))
    const resourceRequirements = [...serviceRequest.service.resourceRequirements]
    for (const option of serviceRequest.options) {
        for (const resourceRequirement of option.resourceRequirements) {
            if (!resourceRequirements.some(r => resourceRequirementFns.sameRequirement(r, resourceRequirement))) {
                resourceRequirements.push(resourceRequirement)
            }
        }
    }
    return {...serviceRequest.service, duration, resourceRequirements}
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
        const date = serviceRequest.date
        const businessAvailabilityForDay = config.availability.availability.filter(a => a.day.value === date.value)
        if (businessAvailabilityForDay.length === 0) {
            return errorResponse(availability.errorCodes.noAvailabilityForDay, `No availability for date '${date.value}'`)
        }
        const resourceAvailabilityForDay = config.resourceAvailability.filter(rda => rda.availability.some(block => block.when.day.value === date.value))
        const service = toService(serviceRequest)
        const possibleStartTimes = service.startTimes ?? calcPossibleStartTimes(config.startTimeSpec, businessAvailabilityForDay, service).map(exactTimeAvailability);
        const result = [] as AvailableSlot[]
        for (const possibleStartTime of possibleStartTimes) {
            const period = toPeriod(date, possibleStartTime, service)
            const resourceOutcome = resourceBookings(resourceAvailabilityForDay, bookings, period)
            if(resourceOutcome._type !== 'error.response') {
                const matchOutcome = resourceRequirementFns.matchRequirements(resourceOutcome.remainingAvailability, period, service.resourceRequirements, [])
                if (matchOutcome._type === "success") {
                    result.push(availableSlot(service, period.day, possibleStartTime, matchOutcome.value.map(r => resourceAllocation(r.requirement, r.match.resource))))
                }
            }
        }
        return success(result)
    },
}

export interface ResourceBookingOutcome {
    _type: 'resource.booking.outcome'
    when: DayAndTimePeriod
    remainingAvailability: ResourceDayAvailability[]
    bookings: FullyResourcedBooking[]
}

function resourceBookingOutcome(when: DayAndTimePeriod, remainingAvailability: ResourceDayAvailability[], bookings: FullyResourcedBooking[]): ResourceBookingOutcome {
    return {
        _type: "resource.booking.outcome",
        when,
        remainingAvailability,
        bookings
    }
}

export function resourceBookings(rda: ResourceDayAvailability[], bookings: Booking[], when: DayAndTimePeriod): ResourceBookingOutcome | ErrorResponse {
    let outcome = resourceBookingOutcome(when, rda, [])
    for (const booking of bookings) {
        if (dayAndTimePeriodFns.intersects(bookingFns.calcPeriod(booking), when)) {
            const resourcedBookingOutcome = assignResourcesToBooking(booking, outcome.remainingAvailability)
            if (resourcedBookingOutcome._type === 'error.response') {
                return resourcedBookingOutcome
            }
            const resourcedBookings = [...outcome.bookings, resourcedBookingOutcome]
            const countedResources = fullyResourcedBookingFns.maxResourceUsage(resourcedBookings)
            const exhaustedResources = [...countedResources.entries()].filter(([_, count]) => count >= booking.service.capacity.value).map(([resource, _]) => resource)
            const reducedAvailability = exhaustedResources.reduce((acc, resource) => resourceDayAvailabilityFns.dropAvailability(when, resource, acc), outcome.remainingAvailability)
            outcome = resourceBookingOutcome(when, reducedAvailability, resourcedBookings)
        }
    }
    return outcome
}