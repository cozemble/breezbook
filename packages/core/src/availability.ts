import {
    Booking,
    BusinessConfiguration,
    dayAndTimePeriod,
    DayAndTimePeriod,
    dayAndTimePeriodFns,
    exactTimeAvailability,
    FungibleResource,
    IsoDate,
    NonFungibleResource,
    ResourceDayAvailability,
    ResourceType,
    Service,
    ServiceId,
    StartTimeSpec,
    time24Fns,
    timePeriodFns,
    TimeslotSpec,
    TwentyFourHourClockTime
} from "./types.js";
import {errorResponse, ErrorResponse, success, Success} from "./utils.js";
import {calcSlotPeriod} from "./calculateAvailability.js";

export type StartTime = TimeslotSpec | TwentyFourHourClockTime

export type ResourceAllocation = FungibleResource | NonFungibleResource

export const startTimeFns = {

    toTime24(startTime: StartTime): TwentyFourHourClockTime {
        if (startTime._type === 'twenty.four.hour.clock.time') {
            return startTime
        }
        return startTime.slot.from
    }
}

export interface AvailableSlot {
    _type: 'available.slot'
    service: ServiceId
    startTime: StartTime
    resourceAllocation: ResourceAllocation[]
}

export function availableSlot(service: ServiceId, startTime: StartTime, resourceAllocation: ResourceAllocation[]): AvailableSlot {
    return {
        _type: "available.slot",
        service,
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

interface UnresourceableBooking {
    _type: 'unresourceable.booking'
    booking: Booking
    missingResourceTypes: ResourceType[]
    resourceAllocation: ResourceAllocation[]
}

function unresourceableBooking(booking: Booking, missingResourceTypes: ResourceType[], resourceAllocation: ResourceAllocation[]): UnresourceableBooking {
    return {
        _type: "unresourceable.booking",
        booking,
        missingResourceTypes,
        resourceAllocation
    }
}

type ResourcedBookingOutcome = FullyResourcedBooking | UnresourceableBooking

interface ResourcedBookingAccumulator {
    bookings: ResourcedBookingOutcome[]
    remainingResources: ResourceDayAvailability[]
}

function recordUnresourcedResourceType(outcome: ResourcedBookingOutcome, resourceType: ResourceType): ResourcedBookingOutcome {
    if (outcome._type === 'unresourceable.booking') {
        return {...outcome, missingResourceTypes: [...outcome.missingResourceTypes, resourceType]}
    }
    return unresourceableBooking(outcome.booking, [resourceType], outcome.resourceAllocation)
}

function recordResourceAllocation(booking: ResourcedBookingOutcome, resourceDayAvailability: ResourceDayAvailability): ResourcedBookingOutcome {
    return {...booking, resourceAllocation: [...booking.resourceAllocation, resourceDayAvailability.resource]}
}

function assignResourcesToBooking(booking: Booking, resources: ResourceDayAvailability[], service: Service): ResourcedBookingOutcome {
    return service.resourceTypes.reduce((acc, resourceType) => {
        const possibleResources = resources.filter(r => r.availability.some(ra => ra.day.value === booking.date.value) && r.resource.type.value === resourceType.value)
        if (possibleResources.length === 0) {
            return recordUnresourcedResourceType(acc, resourceType)
        }
        return recordResourceAllocation(acc, possibleResources[0])
    }, fullyResourcedBooking(booking) as ResourcedBookingOutcome)
}


function subtractTimePeriod(period: DayAndTimePeriod, booking: Booking, service: Service): DayAndTimePeriod[] {
    if (period.day.value !== booking.date.value) {
        return [period]
    }
    const servicePeriod = calcSlotPeriod(booking.slot, service.duration)
    return dayAndTimePeriodFns.splitPeriod(period, dayAndTimePeriod(booking.date, servicePeriod))
}

function subtractResources(resourcedBooking: ResourcedBookingOutcome, remainingResources: ResourceDayAvailability[], service: Service): ResourceDayAvailability[] {
    return remainingResources.map(r => {
        if (resourcedBooking.resourceAllocation.some(alloc => alloc.id.value === r.resource.id.value)) {
            return {
                ...r,
                availability: r.availability.flatMap(a => subtractTimePeriod(a, resourcedBooking.booking, service))
            }
        }
        return r
    })
}

function calcActualResourceAvailability(resourceAvailability: ResourceDayAvailability[], bookings: Booking[], service: Service): ResourceDayAvailability[] | UnresourceableBooking {
    const acc: ResourcedBookingAccumulator = {
        bookings: [],
        remainingResources: resourceAvailability
    }
    const resourcedBookingsOutcome = bookings.reduce((acc, booking) => {
        const resourcedBooking = assignResourcesToBooking(booking, acc.remainingResources, service)
        const remainingResources = subtractResources(resourcedBooking, acc.remainingResources, service)
        return {bookings: [...acc.bookings, resourcedBooking], remainingResources}
    }, acc)
    const firstUnresourced = resourcedBookingsOutcome.bookings.find(b => b._type === 'unresourceable.booking') as UnresourceableBooking
    if (firstUnresourced) {
        return firstUnresourced
    }
    return resourcedBookingsOutcome.remainingResources
}

function resourceIsAvailable(rt: ResourceType, time: DayAndTimePeriod, resources: ResourceDayAvailability[]): boolean {
    return resources.some(r => r.resource.type.value === rt.value && r.availability.some(a => dayAndTimePeriodFns.overlaps(dayAndTimePeriod(a.day, a.period), time)))
}

function resourcesAreAvailable(resourceTypes: ResourceType[], time: DayAndTimePeriod, actualAvailableResources: ResourceDayAvailability[]): boolean {
    return resourceTypes.every(rt => resourceIsAvailable(rt, time, actualAvailableResources))
}

export const availability = {
    errorCodes: {
        noAvailabilityForDay: 'no.availability.for.day',
        serviceNotFound: 'service.not.found',
        noResourcesAvailable: 'no.resources.available',
        unresourceableBooking: 'unresourceable.booking'
    },
    calculateAvailableSlots: (config: BusinessConfiguration,
                              bookings: Booking[],
                              serviceId: ServiceId,
                              date: IsoDate): Success<AvailableSlot[]> | ErrorResponse => {
        const availabilityForDay = config.availability.availability.filter(a => a.day.value === date.value)
        if (availabilityForDay.length === 0) {
            return errorResponse(availability.errorCodes.noAvailabilityForDay, `No availability for date '${date.value}'`)
        }
        const service = config.services.find(s => s.id.value === serviceId.value)
        if (!service) {
            return errorResponse(availability.errorCodes.serviceNotFound, `No service with id '${serviceId.value}'`)
        }
        const bookingsForDate = bookings.filter(b => b.date.value === date.value)
        const resourceAvailabilityOutcome = calcActualResourceAvailability(config.resourceAvailability, bookingsForDate, service)
        if (!Array.isArray(resourceAvailabilityOutcome)) {
            return errorResponse(availability.errorCodes.unresourceableBooking, `Could not resource booking '${resourceAvailabilityOutcome.booking.id.value}', missing resource types are ${resourceAvailabilityOutcome.missingResourceTypes.map(rt => rt.value)}`)
        }
        if(resourceAvailabilityOutcome.length === 0 && service.resourceTypes.length > 0) {
            return errorResponse(availability.errorCodes.noResourcesAvailable, `Do not have resources for service '${serviceId.value}'`)
        }
        const possibleStartTimes = calcPossibleStartTimes(config.startTimeSpec, availabilityForDay, service)
        const startTimesWithResources = possibleStartTimes.filter(time => resourcesAreAvailable(service.resourceTypes, dayAndTimePeriod(date, calcSlotPeriod(exactTimeAvailability(time), service.duration)), resourceAvailabilityOutcome))
        return success(startTimesWithResources.map(t => availableSlot(serviceId, t, [])))
    }

}