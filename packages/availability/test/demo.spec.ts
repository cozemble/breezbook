import {anySuitableResource, resourceId, resourceType} from "@breezbook/packages-core";
import {resourcing} from "../src/index.js";
import {test} from 'vitest';
import resource = resourcing.resource;
import timeslotFns = resourcing.timeslotFns;
import service = resourcing.service;
import resourceRequirements = resourcing.resourceRequirements;
import bookingSpec = resourcing.bookingSpec;
import AvailabilityResult = resourcing.AvailabilityResult;
import listAvailability = resourcing.listAvailability;
import complexResourceRequirement = resourcing.complexResourceRequirement;
import resourceCommitment = resourcing.resourceCommitment;
import booking = resourcing.booking;

function startTime(slot: AvailabilityResult) {
    return slot.booking.booking.timeslot.from.time.value;
}

function endTime(slot: AvailabilityResult) {
    return slot.booking.booking.timeslot.to.time.value;
}


function bookedResources(slot: resourcing.Available) {
    return slot.booking.resourceCommitments.map(rc => rc.resource.id.value).join(", ");
}

test("demo anySuitableResource", () => {

    const room = resourceType("room");
    const room1 = resource(room,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")], [], resourceId("room1"));
    const room2 = resource(room,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")], [], resourceId("room2"));

    const meetingService = service(
        resourceRequirements(
            [anySuitableResource(room)]));

    const requestedBooking = bookingSpec(meetingService);

    const requestedTimeSlots = [
        timeslotFns.sameDay("2023-07-01", "10:00", "11:00"),
        timeslotFns.sameDay("2023-07-01", "11:00", "12:00"),
        timeslotFns.sameDay("2023-07-01", "13:00", "14:00"),
    ];

    const availability = resourcing.listAvailability(
        [room1, room2],
        [],
        requestedBooking,
        requestedTimeSlots
    )

    availability.forEach((slot) => {
        const time = `${startTime(slot)} to ${endTime(slot)}`
        if (slot._type === "available") {
            console.log(`Slot ${time} is available`);
            console.log(`\tIt uses resource : ${(bookedResources(slot))}`);
            console.log(`\tThe potential capacity at this slot is ${slot.potentialCapacity.value}`)
            console.log(`\tThe consumed capacity at this slot is ${slot.consumedCapacity.value}`)
        } else {
            console.log(`Slot ${time} is unavailable`);
        }
    });

})

test("demo anySuitableResource with bookings", () => {

    const room = resourceType("room");
    const room1 = resource(room,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")], [],
        resourceId("room1"));
    const room2 = resource(room,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")], [],
        resourceId("room2"));

    const meetingService = service(
        resourceRequirements(
            [anySuitableResource(room)]));

    const requestedBooking = bookingSpec(meetingService);

    const requestedTimeSlots = [
        timeslotFns.sameDay("2023-07-01", "10:00", "11:00"),
        timeslotFns.sameDay("2023-07-01", "11:00", "12:00"),
        timeslotFns.sameDay("2023-07-01", "13:00", "14:00"),
    ];

    const booking1 = booking(
        timeslotFns.sameDay("2023-07-01", "10:00", "11:00"),
        meetingService);
    const booking2 = booking(
        timeslotFns.sameDay("2023-07-01", "10:00", "11:00"),
        meetingService);

    const availability = resourcing.listAvailability(
        [room1, room2],
        [booking1, booking2],
        requestedBooking,
        requestedTimeSlots
    )

    availability.forEach((slot) => {
        const time = `${startTime(slot)} to ${endTime(slot)}`
        if (slot._type === "available") {
            console.log(`Slot ${time} is available`);
            console.log(`\tIt uses resource : ${(bookedResources(slot))}`);
            console.log(`\tThe potential capacity at this slot is ${slot.potentialCapacity.value}`)
            console.log(`\tThe consumed capacity at this slot is ${slot.consumedCapacity.value}`)
        } else {
            console.log(`Slot ${time} is unavailable`);
        }
    });

});

test("demo specificResource", () => {

    const room = resourceType("room");
    const room1 = resource(room,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")], [],
        resourceId("room1"));
    const room2 = resource(room,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")], [],
        resourceId("room2"));
    const anySuitableRoom = anySuitableResource(room);
    const meetingService = service(
        resourceRequirements([anySuitableRoom]));

    const requestedBooking = bookingSpec(meetingService,
        [resourceCommitment(anySuitableRoom, room2)]);

    const requestedTimeSlots = [
        timeslotFns.sameDay("2023-07-01", "10:00", "11:00"),
        timeslotFns.sameDay("2023-07-01", "11:00", "12:00"),
        timeslotFns.sameDay("2023-07-01", "13:00", "14:00"),
    ];

    const availability = listAvailability(
        [room1, room2],
        [],
        requestedBooking,
        requestedTimeSlots
    )

    availability.forEach((slot) => {
        const time = `${startTime(slot)} to ${endTime(slot)}`
        if (slot._type === "available") {
            console.log(`Slot ${time} is available`);
            console.log(`\tIt uses resource : ${(bookedResources(slot))}`);
            console.log(`\tThe potential capacity at this slot is ${slot.potentialCapacity.value}`)
            console.log(`\tThe consumed capacity at this slot is ${slot.consumedCapacity.value}`)
        } else {
            console.log(`Slot ${time} is unavailable`);
        }
    });

});

test("demo complexResourceRequirement", () => {

    const room = resourceType("room");
    const room1 = resource(room,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")], [
            {name: "capacity", value: 10},
            {name: "hasProjector", value: true}
        ], resourceId("room1"));
    const room2 = resource(room,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")], [
            {name: "capacity", value: 20},
            {name: "hasProjector", value: true}
        ], resourceId("room2"));

    const meetingRoomRequirement = complexResourceRequirement(room,
        [
            {name: "capacity", value: 15, operator: "greaterThan"},
            {name: "hasProjector", value: true, operator: "equals"}
        ]);

    const meetingService = service(
        resourceRequirements([meetingRoomRequirement]));
    const proposedBooking = bookingSpec(meetingService);

    const requestedTimeSlots = [
        timeslotFns.sameDay("2023-07-01", "10:00", "11:00"),
        timeslotFns.sameDay("2023-07-01", "11:00", "12:00"),
        timeslotFns.sameDay("2023-07-01", "13:00", "14:00"),
    ];

    const availability = listAvailability(
        [room1, room2],
        [],
        proposedBooking,
        requestedTimeSlots
    );

    availability.forEach((slot) => {
        const time = `${startTime(slot)} to ${endTime(slot)}`
        if (slot._type === "available") {
            console.log(`Slot ${time} is available`);
            console.log(`\tIt uses resource : ${(bookedResources(slot))}`);
            console.log(`\tThe potential capacity at this slot is ${slot.potentialCapacity.value}`)
            console.log(`\tThe consumed capacity at this slot is ${slot.consumedCapacity.value}`)
        } else {
            console.log(`Slot ${time} is unavailable`);
        }
    });


});