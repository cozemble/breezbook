import {describe, expect, test} from "vitest";
import {resourcing} from "../src/index.js";
import {anySuitableResource, capacity, mandatory, resourceId, resourceType} from "@breezbook/packages-core";
import resourceBookings = resourcing.resourceBookings;
import timeslotFns = resourcing.timeslotFns;
import booking = resourcing.booking;
import resource = resourcing.resource;
import service = resourcing.service;
import resourceRequirements = resourcing.resourceRequirements;
import resourcedBooking = resourcing.resourcedBooking;
import resourceCommitment = resourcing.resourceCommitment;
import unresourceableBooking = resourcing.unresourceableBooking;
import resourceAndSlots = resourcing.resourceAndSlots;
import complexResourceRequirement = resourcing.complexResourceRequirement;

describe("given a service requiring fungible resources without capacity, resourceBookings", () => {
    const room = resourceType("room")
    const room1 = resource(room, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], [],resourceId("room1"))
    const room2 = resource(room, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], [],resourceId("room2"))
    const resources = [room1, room2]
    const anyRoom = anySuitableResource(room)
    const theService = service(resourceRequirements([anyRoom]))

    test("should handle an empty bookings list", () => {
        expect(resourceBookings(resources, []).resourced).toEqual([])
    })

    test("should allocate an any_suitable resource when available", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService)
        const resourced = resourceBookings(resources, [booking1])
        expect(resourced.resourced).toEqual([
            resourcedBooking(booking1, [resourceCommitment(anyRoom, room1)])
        ])
    })

    test("should allocate in a least used fashion", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService)
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:30", "10:30"), theService)
        const booking3 = booking(timeslotFns.sameDay("2021-01-01", "10:30", "11:30"), theService)
        const resourced = resourceBookings(resources, [booking1, booking2, booking3]).resourced
        expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[1]).toEqual(resourcedBooking(booking2, [resourceCommitment(anyRoom, room2)]))
        expect(resourced[2]).toEqual(resourcedBooking(booking3, [resourceCommitment(anyRoom, room1)]))
    })

    test("should permit disfavouring of certain resources", () => {
        const disfavourRoom1UntilNineThirty = resourceAndSlots(room1, [timeslotFns.sameDay("2021-01-01", "09:00", "09:30")])
        const disfavourRoom2AfterNineThirty = resourceAndSlots(room2, [timeslotFns.sameDay("2021-01-01", "09:30", "10:00")])

        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:10"), theService) // should be room2
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:10", "09:20"), theService) // should be room2
        const booking3 = booking(timeslotFns.sameDay("2021-01-01", "09:20", "09:30"), theService) // should be room2
        const booking4 = booking(timeslotFns.sameDay("2021-01-01", "09:20", "09:30"), theService) // has to be room1
        const booking5 = booking(timeslotFns.sameDay("2021-01-01", "09:30", "09:40"), theService) // should be room1
        const booking6 = booking(timeslotFns.sameDay("2021-01-01", "09:40", "09:50"), theService) // should be room1
        const booking7 = booking(timeslotFns.sameDay("2021-01-01", "09:40", "09:50"), theService) // has to be room2
        const booking8 = booking(timeslotFns.sameDay("2021-01-01", "09:40", "09:50"), theService) // unresourceable
        const resourced = resourceBookings(resources, [booking1, booking2, booking3, booking4, booking5, booking6, booking7, booking8], {disfavoredResources: [disfavourRoom1UntilNineThirty, disfavourRoom2AfterNineThirty]}).resourced
        expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(anyRoom, room2)]))
        expect(resourced[1]).toEqual(resourcedBooking(booking2, [resourceCommitment(anyRoom, room2)]))
        expect(resourced[2]).toEqual(resourcedBooking(booking3, [resourceCommitment(anyRoom, room2)]))
        expect(resourced[3]).toEqual(resourcedBooking(booking4, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[4]).toEqual(resourcedBooking(booking5, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[5]).toEqual(resourcedBooking(booking6, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[6]).toEqual(resourcedBooking(booking7, [resourceCommitment(anyRoom, room2)]))
        expect(resourced[7]).toEqual(unresourceableBooking(booking8, [anyRoom]))
    });

    test("should not allocate an any_suitable resource when unavailable due to time", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "13:00", "13:30"), theService)
        const resourced = resourceBookings(resources, [booking1]).resourced
        expect(resourced).toEqual([
            unresourceableBooking(booking1, [anyRoom])
        ])
    })

    test("should not allocate an any_suitable resource when unavailable due to usage", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService)
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService)
        const resourced = resourceBookings([room1], [booking1, booking2]).resourced
        expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[1]).toEqual(unresourceableBooking(booking2, [anyRoom]))
    })

    test("should allocate a specific resource when available", () => {
        const fixedRoom = resourceCommitment(anyRoom, room1)
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService, [fixedRoom])
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:30", "10:30"), theService, [fixedRoom])
        const booking3 = booking(timeslotFns.sameDay("2021-01-01", "10:30", "11:30"), theService, [fixedRoom])
        const booking4 = booking(timeslotFns.sameDay("2021-01-01", "11:30", "12:00"), theService)
        const resourced = resourceBookings(resources, [booking1, booking2, booking3, booking4]).resourced

        expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[1]).toEqual(resourcedBooking(booking2, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[2]).toEqual(resourcedBooking(booking3, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[3]).toEqual(resourcedBooking(booking4, [resourceCommitment(anyRoom, room2)]))
    })

    test("should not allocate a specific resource when unavailable", () => {
        const fixedRoom = resourceCommitment(anyRoom, room1)
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService, [fixedRoom])
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), theService, [fixedRoom])
        const resourced = resourceBookings(resources, [booking1, booking2]).resourced

        expect(resourced[0]).toEqual(resourcedBooking(booking1, [resourceCommitment(anyRoom, room1)]))
        expect(resourced[1]).toEqual(unresourceableBooking(booking2, [anyRoom]))
    })
})

describe("given services with a fungible resource with capacity, resourceBookings", () => {
    const meetingRoom = resourceType("meeting room")
    const meetingRoom1 = resource(meetingRoom, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], [],resourceId("meetingRoom1"))
    const meetingRoom2 = resource(meetingRoom, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], [],resourceId("meetingRoom2"))
    const resources = [meetingRoom1, meetingRoom2]
    const teamOnePlanning = service(resourceRequirements([anySuitableResource(meetingRoom)], capacity(10)))
    const teamTwoPlanning = service(resourceRequirements([anySuitableResource(meetingRoom)], capacity(10)))

    test("should handle an empty bookings list", () => {
        expect(resourceBookings(resources, []).resourced).toEqual([])
    })

    test("can allocate a number of bookings at the same time to the same resource", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), teamOnePlanning)
        const booking2 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), teamOnePlanning)
        const booking3 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), teamTwoPlanning)
        const booking4 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "09:30"), teamTwoPlanning)
        const resourced = resourceBookings(resources, [booking1, booking2, booking3, booking4]).resourced
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
        const resourced = resourceBookings(resources, bookings).resourced
        const teamOneRoomRequirement = mandatory(teamOnePlanning.resourceRequirements.resourceRequirements[0], `teamOnePlanning`)
        for (let i = 0; i < 10; i++) {
            expect(resourced[i]).toEqual(resourcedBooking(bookings[i], [resourceCommitment(teamOneRoomRequirement, meetingRoom1)]));
        }
        expect(resourced[10]).toEqual(unresourceableBooking(bookings[10], [teamOneRoomRequirement]));
    });
})

describe("given a service that requires two resources without capacity", () => {
    const room = resourceType("room")
    const equipment = resourceType("equipment")
    const room1 = resource(room, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")], [],resourceId("room1"))
    const projector = resource(equipment, [timeslotFns.sameDay("2021-01-01", "09:00", "12:00")],[], resourceId("projector1"))
    const resources = [room1, projector]
    const anySuitableRoom = anySuitableResource(room)
    const anySuitableEquipment = anySuitableResource(equipment)
    const roomAndEquipmentService = service(resourceRequirements([anySuitableRoom, anySuitableEquipment]))
    const justRoomService = service(resourceRequirements([anySuitableRoom]))
    const justEquipmentService = service(resourceRequirements([anySuitableEquipment]))

    test("should allocate multiple resource types for a single booking", () => {
        const booking1 = booking(timeslotFns.sameDay("2021-01-01", "09:00", "10:00"), roomAndEquipmentService)
        const resourced = resourceBookings(resources, [booking1]).resourced

        expect(resourced[0]).toEqual(resourcedBooking(booking1, [
            resourceCommitment(anySuitableRoom, room1),
            resourceCommitment(anySuitableEquipment, projector)
        ]))
    })

    test("partial resource allocation should result in unresourceable booking", () => {
        const bookingWithJustRoom = booking(timeslotFns.sameDay("2021-01-01", "09:00", "10:00"), justRoomService)
        const bookingWithRoomAndEquipment = booking(timeslotFns.sameDay("2021-01-01", "09:00", "10:00"), roomAndEquipmentService)
        const resourced = resourceBookings(resources, [bookingWithJustRoom, bookingWithRoomAndEquipment]).resourced
        expect(resourced[0]).toEqual(resourcedBooking(bookingWithJustRoom, [resourceCommitment(anySuitableRoom, room1)]))
        expect(resourced[1]).toEqual(unresourceableBooking(bookingWithRoomAndEquipment, [anySuitableRoom]))
    })

    test("should handle overlapping bookings with different resource requirements", () => {
        const bookingWithRoomAndEquipment = booking(timeslotFns.sameDay("2021-01-01", "09:00", "10:00"), roomAndEquipmentService)
        const bookingWithJustRoom = booking(timeslotFns.sameDay("2021-01-01", "09:30", "10:30"), justRoomService)
        const resourced = resourceBookings(resources, [bookingWithRoomAndEquipment, bookingWithJustRoom]).resourced
        expect(resourced[0]).toEqual(resourcedBooking(bookingWithRoomAndEquipment, [
            resourceCommitment(anySuitableRoom, room1),
            resourceCommitment(anySuitableEquipment, projector)
        ]))
        expect(resourced[1]).toEqual(unresourceableBooking(bookingWithJustRoom, [anySuitableRoom]))
    })
});

describe('Complex Resource Selection', () => {
    const meetingRoom = resourceType("meeting room");

    const room101 = resource(
        meetingRoom,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")],
        [
            { name: "capacity", value: 15 },
            { name: "hasWhiteboard", value: true },
            { name: "hasProjector", value: true }
        ],
        resourceId("room101")
    );

    const room102 = resource(
        meetingRoom,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")],
        [
            { name: "capacity", value: 8 },
            { name: "hasWhiteboard", value: true },
            { name: "hasProjector", value: false }
        ],
        resourceId("room102")
    );

    const room103 = resource(
        meetingRoom,
        [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")],
        [
            { name: "capacity", value: 20 },
            { name: "hasWhiteboard", value: false },
            { name: "hasProjector", value: true }
        ],
        resourceId("room103")
    );

    test('should allocate a resource matching all requirements', () => {
        const meetingRequirement = complexResourceRequirement(
            meetingRoom,
            [
                { name: "capacity", value: 10, operator: "greaterThan" },
                { name: "hasWhiteboard", value: true, operator: "equals" },
                { name: "hasProjector", value: true, operator: "equals" }
            ]
        );

        const meetingService = service(resourceRequirements([meetingRequirement]));
        const meetingBooking = booking(timeslotFns.sameDay("2023-07-01", "10:00", "11:00"), meetingService);

        const result = resourceBookings([room101, room102, room103], [meetingBooking]);

        expect(result.resourced).toHaveLength(1);
        expect(result.resourced[0]).toEqual(
            resourcedBooking(meetingBooking, [resourceCommitment(meetingRequirement, room101)])
        );
    });

    test('should not allocate when no resource matches all requirements', () => {
        const strictRequirement = complexResourceRequirement(
            meetingRoom,
            [
                { name: "capacity", value: 25, operator: "greaterThan" },
                { name: "hasWhiteboard", value: true, operator: "equals" },
                { name: "hasProjector", value: true, operator: "equals" }
            ]
        );

        const strictService = service(resourceRequirements([strictRequirement]));
        const strictBooking = booking(timeslotFns.sameDay("2023-07-01", "10:00", "11:00"), strictService);

        const result = resourceBookings([room101, room102, room103], [strictBooking]);

        expect(result.resourced).toHaveLength(1);
        expect(result.resourced[0]).toEqual(
            unresourceableBooking(strictBooking, [strictRequirement])
        );
    });

    test('should handle multiple complex requirements', () => {
        const complexRequirement1 = complexResourceRequirement(
            meetingRoom,
            [{ name: "capacity", value: 10, operator: "greaterThan" }]
        );
        const complexRequirement2 = complexResourceRequirement(
            meetingRoom,
            [{ name: "hasProjector", value: true, operator: "equals" }]
        );

        const multiRequirementService = service(resourceRequirements([complexRequirement1, complexRequirement2]));
        const multiRequirementBooking = booking(timeslotFns.sameDay("2023-07-01", "10:00", "11:00"), multiRequirementService);

        const result = resourceBookings([room101, room102, room103], [multiRequirementBooking]);

        expect(result.resourced).toHaveLength(1);
        expect(result.resourced[0]).toEqual(
            resourcedBooking(multiRequirementBooking, [
                resourceCommitment(complexRequirement1, room101),
                resourceCommitment(complexRequirement2, room101)
            ])
        );
    });

    test('should handle contains operator for string attributes', () => {
        const roomWithFeatures = resource(
            meetingRoom,
            [timeslotFns.sameDay("2023-07-01", "09:00", "17:00")],
            [{ name: "features", value: "whiteboard,projector,video conferencing" }],
            resourceId("roomWithFeatures")
        );

        const featureRequirement = complexResourceRequirement(
            meetingRoom,
            [{ name: "features", value: "video conferencing", operator: "contains" }]
        );

        const featureService = service(resourceRequirements([featureRequirement]));
        const featureBooking = booking(timeslotFns.sameDay("2023-07-01", "10:00", "11:00"), featureService);

        const result = resourceBookings([roomWithFeatures], [featureBooking]);

        expect(result.resourced).toHaveLength(1);
        expect(result.resourced[0]).toEqual(
            resourcedBooking(featureBooking, [resourceCommitment(featureRequirement, roomWithFeatures)])
        );
    });

    test('should handle booking with mixed simple and complex requirements', () => {
        const simpleRequirement = anySuitableResource(meetingRoom);
        const complexRequirement = complexResourceRequirement(
            meetingRoom,
            [{ name: "capacity", value: 10, operator: "greaterThan" }]
        );

        const mixedService = service(resourceRequirements([simpleRequirement, complexRequirement]));
        const mixedBooking = booking(timeslotFns.sameDay("2023-07-01", "10:00", "11:00"), mixedService);

        const result = resourceBookings([room101, room102, room103], [mixedBooking]);

        expect(result.resourced).toHaveLength(1);
        expect(result.resourced[0]).toEqual(
            resourcedBooking(mixedBooking, [
                resourceCommitment(simpleRequirement, room101),
                resourceCommitment(complexRequirement, room101)
            ])
        );
    });
});