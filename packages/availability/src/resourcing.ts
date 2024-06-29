import {
    bookingId,
    BookingId,
    capacity,
    Capacity,
    isoDate,
    IsoDate,
    mandatory,
    resourceId,
    ResourceId,
    resourceRequirementId,
    ResourceRequirementId,
    ResourceType,
    serviceId,
    ServiceId,
    time24,
    timePeriod,
    timePeriodFns,
    TwentyFourHourClockTime
} from "@breezbook/packages-core";

export namespace resourcing {
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

    function resourceRequirementsWithCapacity(resourceRequirements: ResourceRequirement[], capacity: Capacity): ResourceRequirementsWithCapacity {
        return {
            _type: "resource.requirements.with.capacity",
            resourceRequirements,
            capacity
        }
    }

    function resourceRequirementsWithoutCapacity(resourceRequirements: ResourceRequirement[]): ResourceRequirementsWithoutCapacity {
        return {
            _type: "resource.requirements.without.capacity",
            resourceRequirements
        }
    }

    export function resourceRequirements(resourceRequirements: ResourceRequirement[], capacity: Capacity | undefined = undefined): ResourceRequirements {
        return capacity ? resourceRequirementsWithCapacity(resourceRequirements, capacity) : resourceRequirementsWithoutCapacity(resourceRequirements)
    }

    export interface AnySuitableResource {
        _type: 'any.suitable.resource'
        id: ResourceRequirementId
        requirement: ResourceType
    }

    export interface SpecificResource {
        _type: 'specific.resource'
        id: ResourceRequirementId
        resource: Resource
    }

    export function anySuitableResource(requirement: ResourceType, id = resourceRequirementId()): AnySuitableResource {
        return {
            _type: 'any.suitable.resource',
            requirement,
            id
        }
    }

    export function specificResource(resource: Resource, id = resourceRequirementId()): SpecificResource {
        return {
            _type: 'specific.resource',
            resource,
            id
        }
    }

    export type ResourceRequirement = AnySuitableResource | SpecificResource

    interface Service {
        _type: "service"
        id: ServiceId
        resourceRequirements: ResourceRequirements
    }

    export function service(resourceRequirements: ResourceRequirements, id = serviceId()): Service {
        return {
            _type: "service",
            id,
            resourceRequirements,
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
        service: Service
        timeslot: Timeslot
        fixedResourceCommitments: ResourceCommitment[]
        bookedCapacity: Capacity
    }

    interface ResourceCommitment {
        _type: "resource.commitment"
        requirement: ResourceRequirement
        resource: Resource
    }

    export function resourceCommitment(requirement: ResourceRequirement, resource: Resource): ResourceCommitment {
        return {
            _type: "resource.commitment",
            requirement,
            resource
        }
    }

    interface ResourcedBooking {
        _type: "resourced.booking"
        booking: Booking
        resourceCommitments: ResourceCommitment[]
    }

    export function resourcedBooking(booking: Booking, resourceCommitments: ResourceCommitment[]): ResourcedBooking {
        return {
            _type: "resourced.booking",
            booking,
            resourceCommitments
        }
    }

    interface UnresourceableBooking {
        _type: "unresourceable.booking"
        booking: Booking
        unreasourceableRequirements: ResourceRequirement[]
    }

    export function unresourceableBooking(booking: Booking, unreasourceableRequirements: ResourceRequirement[]): UnresourceableBooking {
        return {
            _type: "unresourceable.booking",
            booking,
            unreasourceableRequirements
        }
    }

    export function booking(timeslot: Timeslot, service: Service, fixedResourceAllocations: ResourceCommitment[] = [], bookedCapacity = capacity(1), id = bookingId()): Booking {
        return {
            id,
            timeslot,
            service,
            fixedResourceCommitments: fixedResourceAllocations,
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

    export const timeslotFns = {
        sameDay: (date: string, start: string, end: string) => timeslot(dateAndTime(date, start), dateAndTime(date, end)),
        overlaps(larger: Timeslot, smaller: Timeslot) {
            return larger.from.date.value === smaller.from.date.value
                && larger.to.date.value === smaller.to.date.value
                && timePeriodFns.overlaps(timePeriod(larger.from.time, larger.to.time), timePeriod(smaller.from.time, smaller.to.time))
        },
        intersects(timeslot: Timeslot, timeslot2: Timeslot) {
            return timeslot.from.date.value === timeslot2.from.date.value
                && timeslot.to.date.value === timeslot2.to.date.value
                && timePeriodFns.intersects(timePeriod(timeslot.from.time, timeslot.to.time), timePeriod(timeslot2.from.time, timeslot2.to.time))
        }
    }

    function resourceMatchesRequirement(resource: Resource, requirement: ResourceRequirement) {
        if (requirement._type === "any.suitable.resource") {
            return resource.type.value === requirement.requirement.value

        }
        return resource.id.value === requirement.resource.id.value
    }

    type ResourceBookingResult = ResourcedBooking | UnresourceableBooking

    interface ResourceUsage {
        _type: "resource.usage"
        resource: Resource
        bookings: Booking[]
    }

    export function resourceUsage(resource: Resource, bookings: Booking[] = []): ResourceUsage {
        return {
            _type: "resource.usage",
            resource,
            bookings
        }
    }

    interface ResourcingAccumulator {
        resources: ResourceUsage[]
        resourced: ResourceBookingResult[]
    }

    export function resourcingAccumulator(resources: ResourceUsage[], resourced: ResourceBookingResult[] = []): ResourcingAccumulator {
        return {
            resources,
            resourced
        }
    }

    function allocateResources(accumulator: ResourcingAccumulator, booking: Booking): ResourcingAccumulator {
        const resourcedOutcome = resourceBooking(accumulator.resources, booking)
        if (resourcedOutcome._type === "unresourceable.booking") {
            return {
                resources: accumulator.resources,
                resourced: [...accumulator.resourced, resourcedOutcome]
            }
        }
        const updatedResources = resourcedOutcome.resourceCommitments.reduce((resources, commitment) => {
            const resourceIndex = resources.findIndex(r => r.resource.id.value === commitment.resource.id.value)
            const resource = resources[resourceIndex]
            return [
                ...resources.slice(0, resourceIndex),
                {
                    ...resource,
                    bookings: [...resource.bookings, booking]
                },
                ...resources.slice(resourceIndex + 1)
            ]
        }, accumulator.resources);
        return {
            resources: updatedResources,
            resourced: [...accumulator.resourced, resourcedOutcome]
        }
    }

    function resourceIsAvailable(resource: Resource, timeslot: Timeslot): boolean {
        return resource.availability.some(a => timeslotFns.overlaps(a, timeslot))
    }

    function replaceIfFixed(requirement: ResourceRequirement, fixedResourceAllocations: ResourceCommitment[]): ResourceRequirement {
        const fixed = fixedResourceAllocations.find(f => f.requirement.id.value === requirement.id.value)
        return fixed ? specificResource(fixed.resource, fixed.requirement.id) : requirement
    }

    function getAvailableResources(resources: ResourceUsage[], requirement: ResourceRequirement, booking: Booking) {
        if (booking.service.resourceRequirements._type === "resource.requirements.with.capacity") {
            const maybeExistingResource = resources.find(r => r.bookings.some(b => timeslotFns.overlaps(b.timeslot, booking.timeslot) && b.service.id.value === booking.service.id.value))
            if (maybeExistingResource) {
                const totalBookedCapacity = maybeExistingResource.bookings.filter(b => timeslotFns.overlaps(b.timeslot, booking.timeslot)).reduce((total, b) => total + b.bookedCapacity.value, 0)
                const serviceCapacity = booking.service.resourceRequirements.capacity.value
                if (totalBookedCapacity + booking.bookedCapacity.value <= serviceCapacity) {
                    return [maybeExistingResource]
                }
                return []
            }
        }
        return resources.filter(resource =>
            resourceMatchesRequirement(resource.resource, requirement)
            && resourceIsAvailable(resource.resource, booking.timeslot)
            && !resourceIsUsed(resource, booking.timeslot));
    }

    function resourceIsUsed(resource: ResourceUsage, timeslot: Timeslot): boolean {
        return resource.bookings.some(b => timeslotFns.intersects(b.timeslot, timeslot))
    }

    function assignSpecificResource(specificRequirement: SpecificResource, availableResources: ResourceUsage[], requestedRequirement: ResourceRequirement) {
        const resource = specificRequirement.resource
        const found = availableResources.find(r => r.resource.id.value === resource.id.value)
        if (!found) {
            return unsatisfiableResourceRequirement(requestedRequirement)
        }
        return resourceCommitment(requestedRequirement, found.resource)
    }

    function assignLeastUsedResource(availableResources: ResourceUsage[], requirement: ResourceRequirement) {
        const countedUsage = availableResources.map(r => ({
            resource: r,
            count: r.bookings.length
        }))
        const sortedByUsage = countedUsage.sort((a, b) => a.count - b.count)
        return resourceCommitment(requirement, sortedByUsage[0].resource.resource)
    }

    function resourceBooking(resources: ResourceUsage[], booking: Booking): ResourceBookingResult {
        const allocationOutcome = booking.service.resourceRequirements.resourceRequirements.map(requirement => {
            const activeRequirement = replaceIfFixed(requirement, booking.fixedResourceCommitments)
            const availableResources = getAvailableResources(resources, activeRequirement, booking);
            if (availableResources.length === 0) {
                return unsatisfiableResourceRequirement(requirement)
            }
            if (activeRequirement._type === "specific.resource") {
                return assignSpecificResource(activeRequirement, availableResources, requirement);
            }
            return assignLeastUsedResource(availableResources, requirement);
        })
        const unsatisfiable = allocationOutcome.filter(a => a._type === "unsatisfiable.resource.requirement")
        if (unsatisfiable.length > 0) {
            return unresourceableBooking(booking, unsatisfiable.map(u => (u as UnsatisfiableResourceRequirement).resourceRequirement))
        }
        return resourcedBooking(booking, allocationOutcome as ResourceCommitment[])
    }

    function accumulateResourcedBookings(bookings: Booking[], initialAccumulator: ResourcingAccumulator): ResourcingAccumulator {
        return bookings.reduce((accumulator, booking) => allocateResources(accumulator, booking), initialAccumulator)
    }

    export function toResourceUsages(resources: Resource[]) {
        return resources.map(r => resourceUsage(r));
    }

    export function resourceBookings(resources: Resource[], bookings: Booking[]): ResourcingAccumulator {
        return accumulateResourcedBookings(bookings, resourcingAccumulator(toResourceUsages(resources)));
    }

    type AvailabilityResult = Available | Unavailable

    interface Available {
        _type: "available"
        booking: ResourcedBooking
        potentialCapacity: Capacity
        consumedCapacity: Capacity
    }

    interface Unavailable {
        _type: "unavailable"
        booking: UnresourceableBooking
    }

    export function available(booking: ResourcedBooking, potentialCapacity: Capacity, consumedCapacity: Capacity): Available {
        return {
            _type: "available",
            booking,
            potentialCapacity,
            consumedCapacity
        }
    }

    export function unavailable(booking: UnresourceableBooking): Unavailable {
        return {
            _type: "unavailable",
            booking
        }
    }

    export function checkAvailability(existingUsage: ResourcingAccumulator, booking: Booking): AvailabilityResult {
        const outcome = accumulateResourcedBookings([booking], existingUsage)
        const resourcingOutcome = mandatory(outcome.resourced.find(r => r.booking.id.value === booking.id.value), `No outcome found for booking ${booking.id.value}`)
        if (resourcingOutcome._type === "unresourceable.booking") {
            return unavailable(resourcingOutcome)
        }
        return available(resourcingOutcome, capacity(-1), capacity(-1)) // capacity todo
    }
}