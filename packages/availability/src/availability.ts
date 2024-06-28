import {
    BookingId,
    capacity,
    Capacity,
    Duration,
    isoDate,
    IsoDate,
    ResourceId,
    ResourceRequirement,
    ResourceType,
    serviceId,
    ServiceId,
    time24,
    TwentyFourHourClockTime
} from "@breezbook/packages-core";

export namespace availability {
    interface Service {
        _type: "service"
        id: ServiceId
        resourceRequirements: ResourceRequirement[]
        capacity: Capacity
    }

    interface ServiceRequest {
        _type: "service.request";
        service: Service
        duration: Duration
        requestedCapacity: Capacity
    }

    export function service(resourceRequirements: ResourceRequirement[], theCapacity: Capacity = capacity(1), id = serviceId()): Service {
        return {
            _type: "service",
            id,
            resourceRequirements,
            capacity: theCapacity
        }
    }

    export function serviceRequest(service: Service, duration: Duration): ServiceRequest {
        return {
            _type: "service.request",
            service,
            duration,
            requestedCapacity: capacity(1)
        }
    }

    interface DateAndTime {
        _type: "date.and.time"
        date: IsoDate
        time: TwentyFourHourClockTime
    }

    interface Timeslot {
        _type: "timeslot"
        from: DateAndTime
        to: DateAndTime
    }

    export function dateAndTime(givenDate: IsoDate | string, givenTime: TwentyFourHourClockTime | string): DateAndTime {
        const date = typeof givenDate === "string" ? isoDate(givenDate) : givenDate
        const time = typeof givenTime === "string" ? time24(givenTime) : givenTime
        return {
            _type: "date.and.time",
            date,
            time
        }
    }

    export function timeslot(from: DateAndTime, to: DateAndTime): Timeslot {
        return {
            _type: "timeslot",
            from,
            to
        }
    }

    interface Booking {
        id: BookingId
        timeslot: Timeslot
        resourceCommitments: ResourceRequirement[]
        capacity: Capacity
    }

    interface Resource {
        _type: "resource"
        id: ResourceId
        type: ResourceType
        availability: Timeslot[]
    }

    type AvailabilityResult = Available | Unavailable

    interface Available {
        _type: "available"
        timeSlot: Timeslot
        assignedResources: ResourceRequirement[]
        possibleCapacity: Capacity
        remainingCapacity: Capacity
    }

    export function available(timeSlot: Timeslot, assignedResources: ResourceRequirement[], possibleCapacity: Capacity, remainingCapacity: Capacity): Available {
        return {
            _type: "available",
            timeSlot,
            assignedResources,
            possibleCapacity,
            remainingCapacity
        }
    }

    interface Unavailable {
        _type: "unavailable"
        timeSlot: Timeslot
        reason: string
    }

    export const timeslotFns = {
        sameDay: (date: string, start: string, end: string) => timeslot(dateAndTime(date, start), dateAndTime(date, end))
    }

    export function checkAvailability(request: ServiceRequest, resources: Resource[], bookings: Booking[], slots: Timeslot[]): AvailabilityResult[] {
        return slots.map(s => available(s, [], capacity(1), capacity(1)))
    }
}