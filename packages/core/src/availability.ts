import {AddOn, Booking, BusinessAvailability, Service, ServiceOption, StartTimeSpec, TimeslotSpec,} from "./types.js";
import {errorResponse, ErrorResponse, mandatory, success, Success} from "./utils.js";
import {
    Capacity,
    dayAndTimePeriod,
    DayAndTimePeriod,
    exactTimeAvailability,
    ExactTimeAvailability,
    IsoDate,
    minuteFns,
    minutes,
    Minutes,
    time24Fns,
    TimePeriod,
    timePeriod,
    timePeriodFns,
    TwentyFourHourClockTime
} from "@breezbook/packages-types";
import {resourcing} from "@breezbook/packages-resourcing";
import {configuration} from "./configuration/configuration.js";
import ResourceRequirement = resourcing.ResourceRequirement;
import Resource = resourcing.Resource;
import ResourceDayAvailability = configuration.ResourceDayAvailability;
import listAvailability = resourcing.listAvailability;
import resource = resourcing.resource;
import timeslot = resourcing.timeslot;
import dateAndTime = resourcing.dateAndTime;
import resourceRequirements = resourcing.resourceRequirements;
import resourceBookings = resourcing.resourceBookings;
import ResourceBookingResult = resourcing.ResourceBookingResult;
import Available = resourcing.Available;

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
    getStartTime(startTime: StartTime): TwentyFourHourClockTime {
        if (startTime._type === 'exact.time.availability') {
            return startTime.time
        }
        return startTime.slot.from
    },
    getEndTime(startTime: StartTime, duration: Minutes): TwentyFourHourClockTime {
        if (startTime._type === 'exact.time.availability') {
            return time24Fns.addMinutes(startTime.time, duration)
        }
        return startTime.slot.to
    }
}

export interface AvailableSlot {
    _type: 'available.slot'
    serviceRequest: ServiceRequest
    startTime: StartTime
    resourceAllocation: ResourceAllocation[]
    possibleCapacity: Capacity
    consumedCapacity: Capacity
}

export function availableSlot(serviceRequest: ServiceRequest, startTime: StartTime, resourceAllocation: ResourceAllocation[], possibleCapacity: Capacity,
                              consumedCapacity: Capacity): AvailableSlot {
    return {
        _type: "available.slot",
        serviceRequest,
        startTime,
        resourceAllocation,
        possibleCapacity,
        consumedCapacity
    }
}

export const availableSlotFns = {

    duration(slot: AvailableSlot): Minutes {
        return time24Fns.duration(startTimeFns.getStartTime(slot.startTime), startTimeFns.getEndTime(slot.startTime, slot.serviceRequest.service.duration)).value
    },
    servicePeriod(slot: AvailableSlot): TimePeriod {
        return timePeriod(startTimeFns.getStartTime(slot.startTime), startTimeFns.getEndTime(slot.startTime, slot.serviceRequest.service.duration))
    }
}

function calcPossibleStartTimes(startTimeSpec: StartTimeSpec, availabilityForDay: DayAndTimePeriod[], serviceDuration: Minutes): TwentyFourHourClockTime[] {
    if (startTimeSpec._type === 'periodic.start.time') {
        return availabilityForDay.flatMap(a => {
            const possibleStartTimes = timePeriodFns.listPossibleStartTimes(a.period, startTimeSpec.period)
            return possibleStartTimes.filter(time => time24Fns.addMinutes(time, serviceDuration).value <= a.period.to.value)
        })
    } else {
        return startTimeSpec.times
    }
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

export interface ServiceOptionAndQuantity {
    option: ServiceOption
    quantity: number
}

export function serviceOptionAndQuantity(option: ServiceOption, quantity: number): ServiceOptionAndQuantity {
    return {option, quantity}
}

export interface AddOnAndQuantity {
    addOn: AddOn
    quantity: number
}

export function addOnAndQuantity(addOn: AddOn, quantity: number): AddOnAndQuantity {
    return {addOn, quantity}
}

export interface ServiceRequest {
    _type: 'service.request'
    date: IsoDate;
    service: Service;
    options: ServiceOptionAndQuantity[]
    addOns: AddOnAndQuantity[]
}

export function serviceRequest(service: Service, date: IsoDate, addOns: AddOnAndQuantity[] = [], options: ServiceOptionAndQuantity[] = []): ServiceRequest {
    return {
        _type: "service.request",
        date,
        service,
        addOns,
        options
    }
}

function toPeriod(date: IsoDate, possibleStartTime: StartTime, serviceDuration: Minutes): DayAndTimePeriod {
    if (possibleStartTime._type === 'timeslot.spec') {
        return dayAndTimePeriod(date, possibleStartTime.slot)
    }
    return dayAndTimePeriod(date, timePeriod(possibleStartTime.time, time24Fns.addMinutes(possibleStartTime.time, serviceDuration)))
}

function toService(serviceRequest: ServiceRequest): resourcing.Service {
    const totalRequirements = [...serviceRequest.service.resourceRequirements, ...serviceRequest.options.flatMap(o => o.option.resourceRequirements)]
    const requirements = serviceRequest.service.capacity.value > 1 ? resourceRequirements(totalRequirements, serviceRequest.service.capacity) : resourceRequirements(totalRequirements)
    return resourcing.service(requirements, serviceRequest.service.id)
}

function mapResourceAvailability(acc: Resource[], rda: ResourceDayAvailability): Resource[] {
    const theResource = acc.find(r => r.id.value === rda.resource.id.value) ?? resource(rda.resource.type, [], rda.resource.metadata, rda.resource.id)
    const timeslots = rda.availability.map(a => timeslot(dateAndTime(a.when.day, a.when.period.from), dateAndTime(a.when.day, a.when.period.to)))
    const updatedResource: Resource = {...theResource, availability: [...theResource.availability, ...timeslots]}
    // replace or append the resource
    return acc.filter(r => r.id.value !== rda.resource.id.value).concat(updatedResource)
}

function toResourceableBooking(booking: Booking, resources: Resource[]): resourcing.Booking {
    const requirements = booking.service.capacity.value === 1 ? resourceRequirements(booking.service.resourceRequirements) : resourceRequirements(booking.service.resourceRequirements, booking.service.capacity)
    const service: resourcing.Service = resourcing.service(requirements, booking.service.id)
    const fixedResourceCommitments = booking.fixedResourceAllocation.map(r => {
        const requirement = mandatory(service.resourceRequirements.resourceRequirements.find(rr => rr.id.value === r.requirementId.value), `No resource requirement for id '${r.requirementId.value}'`)
        const resource = mandatory(resources.find(res => res.id.value === r.resourceId.value), `No resource for id '${r.resourceId.value}'`)
        return resourcing.resourceCommitment(requirement, resource);
    })
    return resourcing.booking(
        timeslot(dateAndTime(booking.date, booking.period.from), dateAndTime(booking.date, booking.period.to)),
        service, fixedResourceCommitments, booking.bookedCapacity, booking.id)
}

function startTimeForResponse(availabilityOutcome: Available, startTimes: StartTime[] | null) {
    if (startTimes && startTimes.length > 0 && startTimes?.[0]?._type === 'timeslot.spec') {
        const timeSlots = startTimes as TimeslotSpec[];
        return mandatory(
            timeSlots.find(ts => time24Fns.equals(ts.slot.from, availabilityOutcome.booking.booking.timeslot.from.time)),
            `No start time found for timeslot ${availabilityOutcome.booking.booking.timeslot.from.time.value} in ${timeSlots.map(ts => ts.slot.from.value).join(",")}`);

    }
    return exactTimeAvailability(availabilityOutcome.booking.booking.timeslot.from.time);
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
        const mappedResources = config.resourceAvailability.reduce(mapResourceAvailability, [] as Resource[])
        const service = toService(serviceRequest)
        const mappedBookings = bookings.map(b => toResourceableBooking(b, mappedResources))
        const bookingSpec = resourcing.bookingSpec(service)
        const duration = [serviceRequest.service.duration, ...serviceRequest.options.map(o => o.option.duration.value)].reduce((acc, d) => minuteFns.sum(acc, d), minutes(0))
        const possibleStartTimes = serviceRequest.service.startTimes ?? calcPossibleStartTimes(config.startTimeSpec, businessAvailabilityForDay, duration).map(exactTimeAvailability);
        const requestedSlots = possibleStartTimes.map(st => toPeriod(serviceRequest.date, st, duration)).map(p => timeslot(dateAndTime(p.day, p.period.from), dateAndTime(p.day, p.period.to)))
        const availabilityOutcomes = listAvailability(mappedResources, mappedBookings, bookingSpec, requestedSlots)
        const result = [] as AvailableSlot[]
        for (const availabilityOutcome of availabilityOutcomes) {
            if (availabilityOutcome._type === 'available') {
                result.push(availableSlot(
                    serviceRequest,
                    startTimeForResponse(availabilityOutcome, serviceRequest.service.startTimes),
                    availabilityOutcome.booking.resourceCommitments.map(r => resourceAllocation(r.requirement, r.resource)),
                    availabilityOutcome.potentialCapacity,
                    availabilityOutcome.consumedCapacity
                ))
            }
        }
        return success(result)
    },
    checkAvailability(config: AvailabilityConfiguration, existingBookings: Booking[], newBookings: Booking[]): ResourceBookingResult[] {
        const mappedResources = config.resourceAvailability.reduce(mapResourceAvailability, [] as Resource[])
        const mappedBookings = [...existingBookings, ...newBookings].map(b => toResourceableBooking(b, mappedResources))
        const expectedBookingIds = newBookings.map(b => b.id.value)
        return resourceBookings(mappedResources, mappedBookings).resourced.filter(r => expectedBookingIds.includes(r.booking.id.value))
    }
}