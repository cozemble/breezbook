import {describe, expect, test} from 'vitest'
import {
    AnySuitableResource,
    booking,
    carwash,
    customerId,
    fullyResourcedBooking,
    fullyResourcedBookingFns,
    isoDate,
    resourceAllocation
} from "../src/index.js";

describe("fullyResourcedBookingFns.maxResourceUsage", () => {

    test("usage count is zero when there are no bookings", () => {
        const count = fullyResourcedBookingFns.maxResourceUsage([])
        expect(count.size).toBe(0)
    });

    test("usage count is zero when there are no bookings for the resource", () => {
        const serviceWithNoResourcRequirements = {...carwash.smallCarWash, resourceRequirements: []}
        const count = fullyResourcedBookingFns.maxResourceUsage([
            fullyResourcedBooking(booking(customerId(), serviceWithNoResourcRequirements, isoDate(), carwash.oneToFour.slot, [])),
        ])
        expect(count.size).toBe(0)
    })

    test("usage count is one when there is one booking for the resource", () => {
        const theBooking = booking(customerId(), carwash.smallCarWash, isoDate(), carwash.oneToFour.slot, [])
        const count = fullyResourcedBookingFns.maxResourceUsage([
            fullyResourcedBooking(theBooking, [resourceAllocation(carwash.smallCarWash.resourceRequirements[0] as AnySuitableResource, carwash.van1)]),
        ])
        expect(count.get(carwash.van1)).toBe(1)
    });

    test("usage count is one when there is resource usage is sequential", () => {
        const booking1 = booking(customerId(), carwash.smallCarWash, isoDate(), carwash.nineToOne.slot, [])
        const booking2 = booking(customerId(), carwash.smallCarWash, isoDate(), carwash.oneToFour.slot, [])
        const count = fullyResourcedBookingFns.maxResourceUsage([
            fullyResourcedBooking(booking1, [resourceAllocation(carwash.smallCarWash.resourceRequirements[0] as AnySuitableResource, carwash.van1)]),
            fullyResourcedBooking(booking2, [resourceAllocation(carwash.smallCarWash.resourceRequirements[0] as AnySuitableResource, carwash.van1)]),
        ])
        expect(count.get(carwash.van1)).toBe(1)
    });
});