import {describe, expect, test} from 'vitest'
import {
    anySuitableResource,
    AnySuitableResource,
    booking,
    capacity,
    carwash,
    currencies,
    customerId,
    fullyResourcedBooking,
    fullyResourcedBookingFns,
    isoDate,
    price,
    resource,
    resourceAllocation,
    resourceType,
    service
} from "../src/index.js";

const date = isoDate()

describe("fullyResourcedBookingFns.maxResourceUsage", () => {

    test("usage count is zero when there are no bookings", () => {
        const count = fullyResourcedBookingFns.maxResourceUsage([])
        expect(count.size).toBe(0)
    });

    test("usage count is zero when there are no bookings for the resource", () => {
        const serviceWithNoResourcRequirements = {...carwash.smallCarWash, resourceRequirements: []}
        const count = fullyResourcedBookingFns.maxResourceUsage([
            fullyResourcedBooking(booking(customerId(), serviceWithNoResourcRequirements, date, carwash.oneToFour.slot)),
        ])
        expect(count.size).toBe(0)
    })

    test("usage count is one when there is one booking for the resource", () => {
        const theBooking = booking(customerId(), carwash.smallCarWash, date, carwash.oneToFour.slot)
        const count = fullyResourcedBookingFns.maxResourceUsage([
            fullyResourcedBooking(theBooking, [resourceAllocation(carwash.smallCarWash.resourceRequirements[0] as AnySuitableResource, carwash.van1)]),
        ])
        expect(count.get(carwash.van1)).toBe(1)
    });

    test("usage count is one when there is resource usage is sequential", () => {
        const booking1 = booking(customerId(), carwash.smallCarWash, date, carwash.nineToOne.slot)
        const booking2 = booking(customerId(), carwash.smallCarWash, date, carwash.oneToFour.slot)
        const count = fullyResourcedBookingFns.maxResourceUsage([
            fullyResourcedBooking(booking1, [resourceAllocation(carwash.smallCarWash.resourceRequirements[0] as AnySuitableResource, carwash.van1)]),
            fullyResourcedBooking(booking2, [resourceAllocation(carwash.smallCarWash.resourceRequirements[0] as AnySuitableResource, carwash.van1)]),
        ])
        expect(count.get(carwash.van1)).toBe(1)
    });

    test("usage count is begins with the booked capacity", () => {
        const dogIntake = resourceType("dogs", true);
        const sixDogs = resource(dogIntake, "Dog")
        const theService = service("Dog Walk", "Dog Walk", [anySuitableResource(dogIntake)], 480, price(3500, currencies.GBP), [], [], capacity(6));
        const booking1 = booking(customerId(), theService, date, carwash.nineToOne.slot, "confirmed", capacity(5))
        const count = fullyResourcedBookingFns.maxResourceUsage([
            fullyResourcedBooking(booking1, [resourceAllocation(theService.resourceRequirements[0] as AnySuitableResource, sixDogs)]),
        ])
        expect(count.get(sixDogs)).toBe(5)
    })

    test("usage count is sums the booked capacity", () => {
        const dogIntake = resourceType("dogs", true);
        const sixDogs = resource(dogIntake, "Dog")
        const theService = service("Dog Walk", "Dog Walk", [anySuitableResource(dogIntake)], 480, price(3500, currencies.GBP), [], [], capacity(6));
        const booking1 = booking(customerId(), theService, date, carwash.nineToOne.slot, "confirmed", capacity(2))
        const booking2 = booking(customerId(), theService, date, carwash.nineToOne.slot, "confirmed", capacity(4))
        const count = fullyResourcedBookingFns.maxResourceUsage([
            fullyResourcedBooking(booking1, [resourceAllocation(theService.resourceRequirements[0] as AnySuitableResource, sixDogs)]),
            fullyResourcedBooking(booking2, [resourceAllocation(theService.resourceRequirements[0] as AnySuitableResource, sixDogs)]),
        ])
        expect(count.get(sixDogs)).toBe(6)
    })
});