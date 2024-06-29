import {describe, expect, test} from "vitest";
import {availability} from "../src/availability.js";
import {anySuitableResource, capacity, mandatory, resourceId, resourceType} from "@breezbook/packages-core";
import resourceBookings = availability.resourceBookings;
import timeslotFns = availability.timeslotFns;
import booking = availability.booking;
import resource = availability.resource;
import service = availability.service;
import resourceRequirements = availability.resourceRequirements;
import resourcedBooking = availability.resourcedBooking;
import resourceCommitment = availability.resourceCommitment;
import unresourceableBooking = availability.unresourceableBooking;
import fixedResourceAllocation = availability.fixedResourceAllocation;
import specificResource = availability.specificResource;

describe("given a service requiring fungible resources without capacity, resourceBookings", () => {
    const room = resourceType("room")
    const room1 = resource(room, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], resourceId("room1"))
    const room2 = resource(room, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], resourceId("room2"))
    const resources = [room1, room2]
    const anyRoom = anySuitableResource(room)
    const theService = service(resourceRequirements([anyRoom]))

    test("should handle an empty bookings list", () => {
        expect(resourceBookings(resources, [])).toEqual([])
    })

    test("should allocate an any_suitable resource when available", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService)
        const resourced = resourceBookings(resources, [booking1])
        expect(resourced).toEqual([
            resourcedBooking(booking1, [resourceCommitment(anyRoom, room1)])
        ])
    })

    test("should allocate in a least used fashion", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService)
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:30", "10:30"), theService)
        const booking3 = booking(timeslotFns.sameDay("2021-01-01", "10:30", "11:30"), theService)
        const resourced = resourceBookings(resources, [booking1, booking2, booking3])
        expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[1]).toEqual(resourcedBooking(booking2, [resourceCommitment(anyRoom, room2)]))
        expect(resourced[2]).toEqual(resourcedBooking(booking3, [resourceCommitment(anyRoom, room1)]))
    })

    test("should not allocate an any_suitable resource when unavailable due to time", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "13:00", "13:30"), theService)
        const resourced = resourceBookings(resources, [booking1])
        expect(resourced).toEqual([
            unresourceableBooking(booking1, [anyRoom])
        ])
    })

    test("should not allocate an any_suitable resource when unavailable due to usage", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService)
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService)
        const resourced = resourceBookings([room1], [booking1, booking2])
        expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[1]).toEqual(unresourceableBooking(booking2, [anyRoom]))
    })

    test("should allocate a specific resource when available", () => {
        const fixedRoom = fixedResourceAllocation(anyRoom, room1)
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService, [fixedRoom])
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:30", "10:30"), theService, [fixedRoom])
        const booking3 = booking(timeslotFns.sameDay("2021-01-01", "10:30", "11:30"), theService, [fixedRoom])
        const booking4 = booking(timeslotFns.sameDay("2021-01-01", "11:30", "12:00"), theService)
        const resourced = resourceBookings(resources, [booking1, booking2, booking3, booking4])

        expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[1]).toEqual(resourcedBooking(booking2, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[2]).toEqual(resourcedBooking(booking3, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[3]).toEqual(resourcedBooking(booking4, [resourceCommitment(anyRoom, room2)]))
    })

    test("should not allocate a specific resource when unavailable", () => {
        const fixedRoom = fixedResourceAllocation(anyRoom, room1)
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService, [fixedRoom])
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService, [fixedRoom])
        const resourced = resourceBookings(resources, [booking1, booking2])

        expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[1]).toEqual(unresourceableBooking(booking2, [anyRoom]))
    })
})

describe("given services requiring a specific resource with capacity, resourceBookings", () => {
    const meetingRoom = resourceType("meeting room")
    const smallMeetingRoom = resource(meetingRoom, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], resourceId("smallMeetingRoom"))
    const largeMeetingRoom = resource(meetingRoom, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], resourceId("largeMeetingRoom"))
    const resources = [smallMeetingRoom, largeMeetingRoom]
    const smallMeeting = service(resourceRequirements([specificResource(smallMeetingRoom)], capacity(10)))
    const largeMeeting = service(resourceRequirements([specificResource(largeMeetingRoom)], capacity(20)))
    const competingSmallMeeting = service(resourceRequirements([specificResource(smallMeetingRoom)], capacity(10)))

    test("should handle an empty bookings list", () => {
        expect(resourceBookings(resources, [])).toEqual([])
    })

    test("can allocate a number of bookings at the same time to the same resource", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), smallMeeting)
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), smallMeeting)
        const booking3 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), smallMeeting)
        const resourced = resourceBookings(resources, [booking1, booking2, booking3])
        const smallMeetingRequirement = mandatory(smallMeeting.resourceRequirements.resourceRequirements[0], `smallMeetingRoom`)
        // expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(smallMeetingRequirement, smallMeetingRoom)]))
        // expect(resourced[1]).toEqual(resourcedBooking(booking2, [resourceCommitment(smallMeetingRequirement, smallMeetingRoom)]))
        // expect(resourced[2]).toEqual(resourcedBooking(booking3, [resourceCommitment(smallMeetingRequirement, smallMeetingRoom)]))
    });
})