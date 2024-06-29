import {describe, expect, test} from 'vitest'
import {anySuitableResource, capacity, resourceType} from "@breezbook/packages-core";
import {availability} from "../src/availability.js";
import available = availability.available;
import timeslotFns = availability.timeslotFns;
import resource = availability.resource;
import unavailable = availability.unavailable;
import unsatisfiableResourceRequirement = availability.unsatisfiableResourceRequirement;
import unconstrainedCapacity = availability.unconstrainedCapacity;
import constrainedCapacity = availability.constrainedCapacity;
import resourceRequirementsWithoutCapacity = availability.resourceRequirementsWithoutCapacity;
import resourceRequirementsWithCapacity = availability.resourceRequirementsWithCapacity;

const nineToNineThirty = timeslotFns.sameDay("2021-01-01", "09:00", "09:30");
const nineThirtyToTen = timeslotFns.sameDay("2021-01-01", "09:30", "10:00");
const onePmToTwoPm = timeslotFns.sameDay("2021-01-01", "13:00", "14:00");
const allMorning = timeslotFns.sameDay("2021-01-01", "09:00", "12:00");

describe("given a service that requires no resources", () => {
    const theService = availability.service([])

    test("we can do any time slot", () => {
        // const request = availability.serviceRequest(theService)
        // const result = availability.checkAvailability(request, [], [], [nineToNineThirty, nineThirtyToTen])
        // expect(result).toEqual([
        //     available(nineToNineThirty, [], unconstrainedCapacity()),
        //     available(nineThirtyToTen, [], unconstrainedCapacity())
        // ])
    })
})

describe("given a service that requires one fungible resource", () => {
    const room = resourceType("room")
    const room1 = resource(room, [allMorning])
    const room2 = resource(room, [allMorning])
    const anyRoom = anySuitableResource(room)
    const theService = availability.service(resourceRequirementsWithoutCapacity([anyRoom]))

    test("we can book any room for the service at any time", () => {
        // const request = availability.serviceRequest(theService)
        // const result = availability.checkAvailability(request, [room1, room2], [], [nineToNineThirty, nineThirtyToTen])
        // expect(result).toEqual([
        //     available(nineToNineThirty, [anyRoom], constrainedCapacity(capacity(2), capacity(2))),
        //     available(nineThirtyToTen, [anyRoom], constrainedCapacity(capacity(2), capacity(2)))
        // ])
    })

    test("no availability outside the resource's availability", () => {
        // const request = availability.serviceRequest(theService)
        // const result = availability.checkAvailability(request, [room1], [], [onePmToTwoPm])
        // expect(result).toEqual([
        //     unavailable(onePmToTwoPm, unsatisfiableResourceRequirement(anyRoom))
        // ])
    })

    test("reduced capacity when one room is booked", () => {
        // const booking = availability.booking(nineToNineThirty, theService.id, [anyRoom])
        // const request = availability.serviceRequest(theService)
        // const result = availability.checkAvailability(request, [room1, room2], [booking], [nineToNineThirty, nineThirtyToTen])
        // expect(result).toEqual([
        //     available(nineToNineThirty, [anyRoom], constrainedCapacity(capacity(2), capacity(1))),
        //     available(nineThirtyToTen, [anyRoom], constrainedCapacity(capacity(2), capacity(2)))
        // ])
    });

    test("unavailable when all rooms are booked", () => {
        // const booking1 = availability.booking(nineToNineThirty, theService.id, [anyRoom])
        // const booking2 = availability.booking(nineToNineThirty, theService.id, [anyRoom])
        // const request = availability.serviceRequest(theService)
        // const result = availability.checkAvailability(request, [room1, room2], [booking1, booking2], [nineToNineThirty, nineThirtyToTen])
        // expect(result).toEqual([
        //     unavailable(nineToNineThirty, unsatisfiableResourceRequirement(anyRoom)),
        //     available(nineThirtyToTen, [anyRoom], constrainedCapacity(capacity(2), capacity(2)))
        // ])
    });

    test("no capacity when room is booked with full capacity", () => {
        // const booking = availability.booking(nineToNineThirty, theService.id, [anyRoom], capacity(2))
        // const request = availability.serviceRequest(theService)
        // const result = availability.checkAvailability(request, [room1, room2], [booking], [nineToNineThirty, nineThirtyToTen])
        // expect(result).toEqual([
        //     available(nineToNineThirty, [anyRoom], constrainedCapacity(capacity(2), capacity(0))),
        //     available(nineThirtyToTen, [anyRoom], constrainedCapacity(capacity(2), capacity(2)))
        // ])
    });
})

describe("given a service that requires a fungible resource with capacity", () => {
    const instructor = resourceType("instructor")
    const instructor1 = resource(instructor, [allMorning])
    const anyInstructor = anySuitableResource(instructor)
    const takeTenWithOneInstructor = resourceRequirementsWithCapacity([anyInstructor], capacity(10))
    const theService = availability.service(takeTenWithOneInstructor)

    test("we can book any instructor for the service at any time", () => {
        // const request = availability.serviceRequest(theService)
        // const result = availability.checkAvailability(request, [instructor1], [], [nineToNineThirty, nineThirtyToTen])
        // expect(result).toEqual([
        //     available(nineToNineThirty, [anyInstructor], constrainedCapacity(capacity(10), capacity(10))),
        //     available(nineThirtyToTen, [anyInstructor], constrainedCapacity(capacity(10), capacity(10)))
        // ])
    });

    test("making one booking reduces capacity", () => {
        // const booking = availability.booking(nineToNineThirty, theService.id, takeTenWithOneInstructor)
        // const request = availability.serviceRequest(theService)
        // const result = availability.checkAvailability(request, [instructor1], [booking], [nineToNineThirty, nineThirtyToTen])
        // expect(result).toEqual([
        //     available(nineToNineThirty, [anyInstructor], constrainedCapacity(capacity(10), capacity(9))),
        //     available(nineThirtyToTen, [anyInstructor], constrainedCapacity(capacity(10), capacity(10)))
        // ])
    });

    test("making a booking with capacity reduces the capacity accordingly", () => {
        // const booking = availability.booking(nineToNineThirty, theService.id, takeTenWithOneInstructor, capacity(5))
        // const request = availability.serviceRequest(theService)
        // const result = availability.checkAvailability(request, [instructor1], [booking], [nineToNineThirty, nineThirtyToTen])
        // expect(result).toEqual([
        //     available(nineToNineThirty, [anyInstructor], constrainedCapacity(capacity(10), capacity(5))),
        //     available(nineThirtyToTen, [anyInstructor], constrainedCapacity(capacity(10), capacity(10)))
        // ])
    });
})

describe("given two services, A and B, competing for the same resource", () => {
    const room = resourceType("room")
    const room1 = resource(room, [allMorning])
    const anyRoom = anySuitableResource(room)
    const serviceA = availability.service(resourceRequirementsWithoutCapacity([anyRoom]))
    const serviceB = availability.service(resourceRequirementsWithoutCapacity([anyRoom]))


    test("the first booking for service A makes service B unavailable ", () => {
        // const booking = availability.booking(nineToNineThirty, serviceA.id, [anyRoom])
        // const requestA = availability.serviceRequest(serviceA)
        // const requestB = availability.serviceRequest(serviceB)
        // const result = availability.checkAvailability(requestA, [room1], [booking], [nineToNineThirty, nineThirtyToTen])
        // expect(result).toEqual([
        //     unavailable(nineToNineThirty, unsatisfiableResourceRequirement(anyRoom)),
        //     available(nineThirtyToTen, [anyRoom], constrainedCapacity(capacity(1), capacity(1))
        //     )
        // ])
    });
});
