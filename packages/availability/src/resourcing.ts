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

    interface AttributeRequirement {
        name: string;
        value: string | number | boolean;
        operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains';
    }

    interface ComplexResourceRequirement {
        _type: 'complex.resource.requirement';
        id: ResourceRequirementId;
        resourceType: ResourceType;
        attributeRequirements: AttributeRequirement[];
    }

    export function complexResourceRequirement(resourceType: ResourceType, attributeRequirements: AttributeRequirement[], id = resourceRequirementId()): ComplexResourceRequirement {
        return {
            _type: 'complex.resource.requirement',
            id,
            resourceType,
            attributeRequirements
        }
    }

    export type ResourceRequirement = AnySuitableResource | SpecificResource | ComplexResourceRequirement;

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

    interface BookingSpec {
        id: BookingId
        service: Service
        fixedResourceCommitments: ResourceCommitment[]
        bookedCapacity: Capacity
    }

    export function bookingSpec(service: Service, fixedResourceCommitments: ResourceCommitment[] = [], bookedCapacity: Capacity = capacity(1), id: BookingId = bookingId()): BookingSpec {
        return {
            id,
            service,
            fixedResourceCommitments,
            bookedCapacity
        }
    }

    interface Booking extends BookingSpec {
        timeslot: Timeslot
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

    export function booking(timeslot: Timeslot, service: Service, fixedResourceCommitments: ResourceCommitment[] = [], bookedCapacity = capacity(1), id = bookingId()): Booking {
        return {
            id,
            timeslot,
            service,
            fixedResourceCommitments,
            bookedCapacity
        }
    }

    interface ResourceAttribute {
        name: string;
        value: string | number | boolean;
    }

    interface Resource {
        _type: "resource"
        id: ResourceId
        type: ResourceType
        availability: Timeslot[]
        attributes: ResourceAttribute[];
    }

    export function resource(type: ResourceType, availability: Timeslot[], attributes: ResourceAttribute[] = [], id = resourceId()): Resource {
        return {
            _type: "resource",
            id,
            type,
            availability,
            attributes
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

    function resourceMatchesComplexRequirement(resource: Resource, requirement: ComplexResourceRequirement): boolean {
        if (resource.type.value !== requirement.resourceType.value) {
            return false;
        }

        return requirement.attributeRequirements.every(attrReq => {
            const resourceAttr = resource.attributes.find(attr => attr.name === attrReq.name);
            if (!resourceAttr) return false;

            switch (attrReq.operator) {
                case 'equals':
                    return resourceAttr.value === attrReq.value;
                case 'greaterThan':
                    return typeof resourceAttr.value === 'number' && typeof attrReq.value === 'number' && resourceAttr.value > attrReq.value;
                case 'lessThan':
                    return typeof resourceAttr.value === 'number' && typeof attrReq.value === 'number' && resourceAttr.value < attrReq.value;
                case 'contains':
                    return typeof resourceAttr.value === 'string' && resourceAttr.value.includes(attrReq.value as string);
                default:
                    return false;
            }
        });
    }

    function resourceMatchesRequirement(resource: Resource, requirement: ResourceRequirement): boolean {
        if (requirement._type === "any.suitable.resource") {
            return resource.type.value === requirement.requirement.value;
        }
        if (requirement._type === "specific.resource") {
            return resource.id.value === requirement.resource.id.value;
        }
        if (requirement._type === "complex.resource.requirement") {
            return resourceMatchesComplexRequirement(resource, requirement);
        }
        return false;
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

    function allocateResources(accumulator: ResourcingAccumulator, booking: Booking, options: ResourceBookingsOptions): ResourcingAccumulator {
        const resourcePreferences: ResourcePreferences = {disfavoredResources: options.disfavoredResources || []}
        const resourcedOutcome = resourceBooking(accumulator.resources, booking, resourcePreferences)
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

    function assignLeastUsedResource(availableResources: ResourceUsage[], requirement: ResourceRequirement, resourcePreferences: ResourcePreferences, forTimeslot: Timeslot) {
        const countedUsage = availableResources.map(r => ({
            resource: r,
            count: r.bookings.length
        }))
        const sortedByUsage = countedUsage.sort((a, b) => a.count - b.count)
        const bestResource = sortedByUsage.find(r => !isDisfavored(r.resource.resource, resourcePreferences, forTimeslot))
        return bestResource ? resourceCommitment(requirement, bestResource.resource.resource) : resourceCommitment(requirement, sortedByUsage[0].resource.resource);
    }

    function isDisfavored(resource: Resource, resourcePreferences: ResourcePreferences, forTimeslot: Timeslot) {
        return resourcePreferences.disfavoredResources.some(r => r.resource.id.value === resource.id.value && r.slots.some(s => timeslotFns.overlaps(s, forTimeslot)))
    }

    function resourceBooking(resources: ResourceUsage[], booking: Booking, resourcePreferences: ResourcePreferences): ResourceBookingResult {
        const allocationOutcome = booking.service.resourceRequirements.resourceRequirements.map(requirement => {
            const activeRequirement = replaceIfFixed(requirement, booking.fixedResourceCommitments)
            const availableResources = getAvailableResources(resources, activeRequirement, booking);
            if (availableResources.length === 0) {
                return unsatisfiableResourceRequirement(requirement)
            }
            if (activeRequirement._type === "specific.resource") {
                return assignSpecificResource(activeRequirement, availableResources, requirement);
            }
            return assignLeastUsedResource(availableResources, requirement, resourcePreferences, booking.timeslot);
        })
        const unsatisfiable = allocationOutcome.filter(a => a._type === "unsatisfiable.resource.requirement")
        if (unsatisfiable.length > 0) {
            return unresourceableBooking(booking, unsatisfiable.map(u => (u as UnsatisfiableResourceRequirement).resourceRequirement))
        }
        return resourcedBooking(booking, allocationOutcome as ResourceCommitment[])
    }

    function accumulateResourcedBookings(bookings: Booking[], initialAccumulator: ResourcingAccumulator, options: ResourceBookingsOptions = {}): ResourcingAccumulator {
        return bookings.reduce((accumulator, booking) => allocateResources(accumulator, booking, options), initialAccumulator)
    }

    export function toResourceUsages(resources: Resource[]) {
        return resources.map(r => resourceUsage(r));
    }

    type ResourceAndSlots = { resource: Resource, slots: Timeslot[] }

    export function resourceAndSlots(resource: Resource, slots: Timeslot[]): ResourceAndSlots {
        return {resource, slots}
    }

    interface ResourcePreferences {
        disfavoredResources: ResourceAndSlots[];
    }

    interface ResourceBookingsOptions extends Partial<ResourcePreferences> {

    }


    export function resourceBookings(resources: Resource[], bookings: Booking[], options: ResourceBookingsOptions = {}): ResourcingAccumulator {
        return accumulateResourcedBookings(bookings, resourcingAccumulator(toResourceUsages(resources)), options);
    }

    export type AvailabilityResult = Available | Unavailable

    export interface Available {
        _type: "available"
        booking: ResourcedBooking
        potentialCapacity: Capacity
        consumedCapacity: Capacity
    }

    export interface Unavailable {
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

    function capacityImpliedByResources(resources: Resource[], requirements: ResourceRequirement[], timeslot: Timeslot): Capacity {
        const countForEachRequirement = requirements.map(requirement => {
            const availableResources = resources.filter(r => resourceMatchesRequirement(r, requirement) && resourceIsAvailable(r, timeslot))
            return availableResources.length
        })
        return capacity(Math.min(...countForEachRequirement))
    }

    function calcPotentialCapacity(resources: Resource[], service: Service, timeslot: Timeslot): Capacity {
        if (service.resourceRequirements._type === "resource.requirements.with.capacity") {
            return service.resourceRequirements.capacity
        }
        return capacityImpliedByResources(resources, service.resourceRequirements.resourceRequirements, timeslot)
    }

    function calcConsumedCapacity(resourced: ResourceBookingResult[], service: Service, timeslot: Timeslot): Capacity {
        const resourcedBookings = resourced.filter(r => r._type === "resourced.booking" && timeslotFns.overlaps(r.booking.timeslot, timeslot)) as ResourcedBooking[]
        if (service.resourceRequirements._type === "resource.requirements.with.capacity") {
            return sumBookedCapacityForService(resourcedBookings, service, timeslot)
        }
        const countOfRequirementMatches = service.resourceRequirements.resourceRequirements.map(requirement => {
            return new Set(resourcedBookings.filter(r => r.resourceCommitments.some(c => resourceMatchesRequirement(c.resource, requirement)))).size
        })
        return capacity(Math.max(...countOfRequirementMatches))
    }

    function sumBookedCapacityForService(resourced: ResourcedBooking[], service: Service, timeslot: Timeslot): Capacity {
        const bookingsInPeriod = resourced
            .flatMap(r => r.booking)
            .filter(b => timeslotFns.overlaps(b.timeslot, timeslot) && b.service.id.value === service.id.value)
        return capacity(bookingsInPeriod.reduce((total, b) => total + b.bookedCapacity.value, 0))
    }

    export function checkAvailability(existingUsage: ResourcingAccumulator, booking: Booking): AvailabilityResult {
        const outcome = accumulateResourcedBookings([booking], existingUsage)
        const resourcingOutcome = mandatory(outcome.resourced.find(r => r.booking.id.value === booking.id.value), `No outcome found for booking ${booking.id.value}`)
        if (resourcingOutcome._type === "unresourceable.booking") {
            return unavailable(resourcingOutcome)
        }
        const potentialCapacity = calcPotentialCapacity(existingUsage.resources.map(r => r.resource), booking.service, booking.timeslot)
        const consumedCapacity = calcConsumedCapacity(existingUsage.resourced, booking.service, booking.timeslot)
        return available(resourcingOutcome, potentialCapacity, consumedCapacity)
    }

    export function listAvailability(resources: Resource[], existingBookings: Booking[], proposedBooking: BookingSpec, requestedTimeSlots: Timeslot[]): AvailabilityResult[] {
        const resourceOutcome = resourceBookings(resources, existingBookings, {disfavoredResources: proposedBooking.fixedResourceCommitments.map(f => resourceAndSlots(f.resource, requestedTimeSlots))})
        return requestedTimeSlots.map(requestedTimeSlot => {
            const proposedBookingWithTimeslot = booking(requestedTimeSlot, proposedBooking.service, proposedBooking.fixedResourceCommitments, proposedBooking.bookedCapacity, proposedBooking.id)
            return checkAvailability(resourceOutcome, proposedBookingWithTimeslot)
        })
    }
}