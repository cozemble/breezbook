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

describe("given services a fungible resource with capacity, resourceBookings", () => {
    const meetingRoom = resourceType("meeting room")
    const meetingRoom1 = resource(meetingRoom, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], resourceId("meetingRoom1"))
    const meetingRoom2 = resource(meetingRoom, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], resourceId("meetingRoom2"))
    const resources = [meetingRoom1, meetingRoom2]
    const teamOnePlanning = service(resourceRequirements([anySuitableResource(meetingRoom)], capacity(10)))
    const teamTwoPlanning = service(resourceRequirements([anySuitableResource(meetingRoom)], capacity(10)))

    test("should handle an empty bookings list", () => {
        expect(resourceBookings(resources, [])).toEqual([])
    })

    test("can allocate a number of bookings at the same time to the same resource", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), teamOnePlanning)
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), teamOnePlanning)
        const booking3 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), teamTwoPlanning)
        const booking4 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), teamTwoPlanning)
        const resourced = resourceBookings(resources, [booking1, booking2, booking3, booking4])
        const teamOneRoomRequirement = mandatory(teamOnePlanning.resourceRequirements.resourceRequirements[0], `teamOnePlanning`)
        const teamTwoRoomRequirement = mandatory(teamTwoPlanning.resourceRequirements.resourceRequirements[0], `teamTwoPlanning`)
        expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(teamOneRoomRequirement, meetingRoom1)]))
        expect(resourced[1]).toEqual(resourcedBooking(booking2, [resourceCommitment(teamOneRoomRequirement, meetingRoom1)]))
        expect(resourced[2]).toEqual(resourcedBooking(booking3, [resourceCommitment(teamTwoRoomRequirement, meetingRoom2)]))
        expect(resourced[3]).toEqual(resourcedBooking(booking4, [resourceCommitment(teamTwoRoomRequirement, meetingRoom2)]))
    });

    test("booking unresourceable when capacity is exceeded", () => {
        const bookings = [];
        for (let i = 0; i < 11; i++) {
            bookings.push(booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), teamOnePlanning));
        }
        const resourced = resourceBookings(resources, bookings);
        const teamOneRoomRequirement = mandatory(teamOnePlanning.resourceRequirements.resourceRequirements[0], `teamOnePlanning`)
        for (let i = 0; i < 10; i++) {
            expect(resourced[i]).toEqual(resourcedBooking(bookings[i], [resourceCommitment(teamOneRoomRequirement, meetingRoom1)]));
        }
        expect(resourced[10]).toEqual(unresourceableBooking(bookings[10], [teamOneRoomRequirement]));
    });
})