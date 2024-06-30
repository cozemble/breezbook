import {describe, expect, test} from 'vitest';
import {resourcing} from "../src/index.js";
import {resourceId, resourceType} from '@breezbook/packages-core';
import resource = resourcing.resource;
import timeslotFns = resourcing.timeslotFns;
import anySuitableResource = resourcing.anySuitableResource;
import service = resourcing.service;
import resourceRequirements = resourcing.resourceRequirements;
import booking = resourcing.booking;
import bookingSpec = resourcing.bookingSpec;
import listAvailability = resourcing.listAvailability;
import resourceCommitment = resourcing.resourceCommitment;
import Available = resourcing.Available;

describe("given a service requiring fungible resources without capacity, listAvailability", () => {
    const room = resourceType("room")
    const room1 = resource(room, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], resourceId("room1"))
    const room2 = resource(room, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], resourceId("room2"))
    const resources = [room1, room2]
    const anyRoom = anySuitableResource(room)
    const theService = service(resourceRequirements([anyRoom]))
    const requestedTimeSlots = [
        timeslotFns.sameDay("2021-01-01", "09:00", "09:30"),
        timeslotFns.sameDay("2021-01-01", "09:30", "10:00"),
        timeslotFns.sameDay("2021-01-01", "10:00", "10:30"),
    ]

    test("lists available and unavailable slots", () => {
        const existingBooking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService)
        const existingBooking2 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService)
        const existingBooking3 = booking(timeslotFns.sameDay("2021-01-01", "09:30", "10:30"), theService)
        const proposedBooking = bookingSpec(theService)
        const outcome = listAvailability(resources, [existingBooking1, existingBooking2, existingBooking3], proposedBooking, requestedTimeSlots);
        expect(outcome?.[0]?._type).toBe("unavailable")
        expect(outcome?.[1]?._type).toBe("available")
        expect(outcome?.[2]?._type).toBe("available")
    })

    test("attempts to get the resources we request", () => {
        const existingBookings = requestedTimeSlots.map(t => booking(t, theService))
        const proposedBooking = bookingSpec(theService, [resourceCommitment(anyRoom, room1)])
        const outcome = listAvailability(resources, existingBookings, proposedBooking, requestedTimeSlots);
        const firstSlot = outcome[0] as Available
        const secondSlot = outcome[1] as Available
        const thirdSlot = outcome[2] as Available
        expect(firstSlot?.booking?.resourceCommitments?.[0]?.resource).toEqual(room1)
        expect(secondSlot?.booking?.resourceCommitments?.[0]?.resource).toEqual(room1)
        expect(thirdSlot?.booking?.resourceCommitments?.[0]?.resource).toEqual(room1)
    })

    test("reports the capacity of the resources", () => {
        const room3 = resource(room, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], resourceId("room3"))
        const bookingsForEachSlot = requestedTimeSlots.map(t => booking(t, theService))
        const existingBookings = [...bookingsForEachSlot, ...bookingsForEachSlot]

        const proposedBooking = bookingSpec(theService)
        const outcome = listAvailability([...resources, room3], existingBookings, proposedBooking, requestedTimeSlots);
        const firstSlot = outcome[0] as Available
        const secondSlot = outcome[1] as Available
        const thirdSlot = outcome[2] as Available
        expect(firstSlot?.potentialCapacity?.value).toEqual(3)
        expect(secondSlot?.potentialCapacity?.value).toEqual(3)
        expect(thirdSlot?.potentialCapacity?.value).toEqual(3)

        expect(firstSlot?.consumedCapacity?.value).toEqual(2)
        expect(secondSlot?.consumedCapacity?.value).toEqual(2)
        expect(thirdSlot?.consumedCapacity?.value).toEqual(2)
    })

});
