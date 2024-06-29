import {
    arrays,
    bookingId,
    BookingId,
    capacity,
    Capacity,
    duration,
    Duration,
    FixedResourceAllocation,
    isoDate,
    IsoDate,
    minutes,
    resourceId,
    ResourceId,
    ResourceRequirement,
    ResourceType,
    serviceId,
    ServiceId,
    time24,
    timePeriod,
    timePeriodFns,
    TwentyFourHourClockTime
} from "@breezbook/packages-core";

export namespace availability {
    type ResourceRequirements = ResourceRequirementsWithCapacity | ResourceRequirementsWithoutCapacity

    interface ResourceRequirementsWithCapacity {
        _type: "resource.requirements.with.capacity"
        resourceRequirements: ResourceRequirement[]
        capacity: Capacity
    }

    interface ResourceRequirementsWithoutCapacity {
        _type: "resource.requirements.without.capacity"
        resourceRequirements: ResourceRequirement[]
    }

    export function resourceRequirementsWithCapacity(resourceRequirements: ResourceRequirement[], capacity: Capacity): ResourceRequirementsWithCapacity {
        return {
            _type: "resource.requirements.with.capacity",
            resourceRequirements,
            capacity
        }
    }

    export function resourceRequirementsWithoutCapacity(resourceRequirements: ResourceRequirement[]): ResourceRequirementsWithoutCapacity {
        return {
            _type: "resource.requirements.without.capacity",
            resourceRequirements
        }
    }


    interface Service {
        _type: "service"
        id: ServiceId
        resourceRequirements: ResourceRequirements
    }

    interface ServiceRequest {
        _type: "service.request";
        service: Service
        duration: Duration
        requestedCapacity: Capacity
    }

    export function service(resourceRequirements: ResourceRequirements, id = serviceId()): Service {
        return {
            _type: "service",
            id,
            resourceRequirements,
        }
    }

    export function serviceRequest(service: Service): ServiceRequest {
        return {
            _type: "service.request",
            service,
            duration: duration(minutes(-1)),
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
        serviceId: ServiceId
        timeslot: Timeslot
        fixedResourceAllocations: FixedResourceAllocation[]
        bookedCapacity: Capacity
    }

    export function booking(timeslot: Timeslot, serviceId: ServiceId, fixedResourceAllocations: FixedResourceAllocation[] = [], bookedCapacity = capacity(1), id = bookingId()): Booking {
        return {
            id,
            timeslot,
            serviceId,
            fixedResourceAllocations,
            bookedCapacity
        }
    }

    interface Resource {
        _type: "resource"
        id: ResourceId
        type: ResourceType
        availability: Timeslot[]
    }

    export function resource(type: ResourceType, availability: Timeslot[], id = resourceId()): Resource {
        return {
            _type: "resource",
            id,
            type,
            availability
        }
    }

    type AvailabilityResult = Available | Unavailable

    type CapacityConstraint = UnconstrainedCapacity | ConstrainedCapacity

    interface UnconstrainedCapacity {
        _type: "unconstrained.capacity"
    }

    interface ConstrainedCapacity {
        _type: "constrained.capacity"
        possibleCapacity: Capacity
        remainingCapacity: Capacity
    }

    export function unconstrainedCapacity(): UnconstrainedCapacity {
        return {
            _type: "unconstrained.capacity"
        }
    }

    export function constrainedCapacity(possibleCapacity: Capacity, remainingCapacity: Capacity): ConstrainedCapacity {
        return {
            _type: "constrained.capacity",
            possibleCapacity,
            remainingCapacity
        }
    }


    interface Available {
        _type: "available"
        timeSlot: Timeslot
        assignedResources: ResourceRequirement[]
        capacityConstraint: CapacityConstraint
    }

    export function available(timeSlot: Timeslot, assignedResources: ResourceRequirement[], capacityConstraint: CapacityConstraint): Available {
        return {
            _type: "available",
            timeSlot,
            assignedResources,
            capacityConstraint
        }
    }


    interface UnsatisfiableResourceRequirement {
        _type: "unsatisfiable.resource.requirement"
        resourceRequirement: ResourceRequirement
    }

    export function unsatisfiableResourceRequirement(resourceRequirement: ResourceRequirement): UnsatisfiableResourceRequirement {
        return {
            _type: "unsatisfiable.resource.requirement",
            resourceRequirement
        }
    }

    type UnavailableReason = UnsatisfiableResourceRequirement

    interface Unavailable {
        _type: "unavailable"
        timeSlot: Timeslot
        reason: UnavailableReason
    }

    export function unavailable(timeSlot: Timeslot, reason: UnavailableReason): Unavailable {
        return {
            _type: "unavailable",
            timeSlot,
            reason
        }
    }

    export const timeslotFns = {
        sameDay: (date: string, start: string, end: string) => timeslot(dateAndTime(date, start), dateAndTime(date, end)),
        overlaps(larger: Timeslot, smaller: Timeslot) {
            return larger.from.date.value === smaller.from.date.value && timePeriodFns.overlaps(timePeriod(larger.from.time, larger.to.time), timePeriod(smaller.from.time, smaller.to.time))
        }
    }

    export function checkAvailability(request: ServiceRequest, resources: Resource[], bookings: Booking[], slots: Timeslot[]): AvailabilityResult[] {
        return slots.map(s => checkSlot(request, resources, bookings, s))
    }

    type ResourceAvailabilityResult = ResourcesAvailable | NoResourcesAvailable

    interface ResourcesAvailable {
        _type: "resources.available"
        resourceRequirement: ResourceRequirement
        capacity: Capacity
        possibleResources: Resource[]
        slot: Timeslot
    }

    function resourcesAvailable(resourceRequirement: ResourceRequirement, capacity: Capacity, possibleResources: Resource[], slot: Timeslot): ResourcesAvailable {
        return {
            _type: "resources.available",
            resourceRequirement,
            possibleResources,
            capacity,
            slot
        }
    }

    interface NoResourcesAvailable {
        _type: "no.resources.available"
        resourceRequirement: ResourceRequirement
        slot: Timeslot
    }

    function noResourcesAvailable(resourceRequirement: ResourceRequirement, slot: Timeslot): NoResourcesAvailable {
        return {
            _type: "no.resources.available",
            resourceRequirement,
            slot
        }
    }

    function resourceOverlapsSlot(resource: Resource, slot: Timeslot) {
        return resource.availability.some(a => timeslotFns.overlaps(a, slot));
    }

    function resourceMatchesRequirement(resource: Resource, requirement: ResourceRequirement) {
        if (requirement._type === "any.suitable.resource") {
            return resource.type.value === requirement.requirement.value

        }
        return resource.id.value === requirement.resource.id.value
    }

    function checkResourceAvailability(resourceRequirement: ResourceRequirement, capacity: Capacity, resources: Resource[], slot: Timeslot): ResourceAvailabilityResult {
        const possibleResources = resources.filter(r => resourceMatchesRequirement(r, resourceRequirement) && resourceOverlapsSlot(r, slot));
        if (possibleResources.length === 0) {
            return noResourcesAvailable(resourceRequirement, slot)
        }
        return resourcesAvailable(resourceRequirement, capacity, possibleResources, slot)

    }

    function capacityImpliedByResourceRequirements(availability: ResourcesAvailable[]): number {
        return Math.min(...availability.map(a => a.possibleResources.length))
    }

    function applyResourceCommitment(available: ResourcesAvailable[], commited: ResourceRequirement) {
        const index = commited._type === "any.suitable.resource" ? available.findIndex(a => a.possibleResources.some(r => r.type.value === commited.requirement.value)) : available.findIndex(a => a.possibleResources.some(r => r.id.value === commited.resource.id.value))
        if (index === -1) {
            return available
        }
        const remainingResources = arrays.tail(available[index].possibleResources)
        return [
            ...available.slice(0, index),
            {
                ...available[index],
                possibleResources: remainingResources
            },
            ...available.slice(index + 1)
        ]
    }

    export function applyResourceCommitments(available: ResourcesAvailable[], commited: ResourceRequirement[]): ResourcesAvailable[] {
        return commited.reduce((remaining, c) => applyResourceCommitment(remaining, c), available)
    }


    function checkSlot(request: ServiceRequest, resources: Resource[], bookings: Booking[], slot: Timeslot): AvailabilityResult {
        throw new Error("Not implemented")
        // const resourceAvailabilityCheck = request.service.resourceRequirements.resourceRequirements.map(r => checkResourceAvailability(r, capacity(1),resources, slot))
        // const firstNoResources = resourceAvailabilityCheck.find(r => r._type === "no.resources.available")
        // if (firstNoResources) {
        //     return unavailable(slot, unsatisfiableResourceRequirement(firstNoResources.resourceRequirement))
        // }
        // const resourcesAvailable = resourceAvailabilityCheck as ResourcesAvailable[]
        // const overlappingBookings = bookings.filter(b => timeslotFns.overlaps(b.timeslot, slot))
        // // const possibleSlotCapacity = request.service.capacitySupport._type === "does.not.support.capacity" ? capacity(capacityImpliedByResourceRequirements(resourcesAvailable)) : request.service.capacitySupport.capacity
        // const resourcesRemaining = overlappingBookings.reduce((remaining, b) => applyResourceCommitments(remaining, b.resourceCommitments), resourcesAvailable)
        // const firstExhaustedResource = resourcesRemaining.find(r => r.possibleResources.length === 0)
        // if (firstExhaustedResource) {
        //     return unavailable(slot, unsatisfiableResourceRequirement(firstExhaustedResource.resourceRequirement))
        // }
        // const remainingCapacity = capacity(capacityImpliedByResourceRequirements(resourcesRemaining))
        // // // const availableResources = resourcesAvailableForSlot(resources, slot);
        // const capacityConstraint = request.service.resourceRequirements.length === 0 ? unconstrainedCapacity() : constrainedCapacity(possibleSlotCapacity, remainingCapacity)
        // return available(slot, request.service.resourceRequirements, capacityConstraint)
    }

}