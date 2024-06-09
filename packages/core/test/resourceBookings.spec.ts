import {expect, test} from 'vitest'
import {
    availabilityBlock,
    booking,
    capacity,
    carwash,
    customerId,
    dayAndTimePeriod,
    errorResponseFns,
    isoDate,
    ResourceBookingOutcome,
    resourceBookings,
    resourceDayAvailability,
    time24,
    timePeriod
} from "../src/index.js";

const date = isoDate()
const van1AvailableNineToSix = [resourceDayAvailability(carwash.van1, [availabilityBlock(dayAndTimePeriod(date, carwash.nineToSix))])];
const nineToOneToday = dayAndTimePeriod(date, carwash.nineToOne.slot);

test("does nothing where there are no bookings", () => {
    const outcome = resourceBookings(nineToOneToday, [], van1AvailableNineToSix) as ResourceBookingOutcome
    expect(outcome.remainingAvailability).toEqual(van1AvailableNineToSix)
})

test("does nothing when bookings have no resource requirements", () => {
    const theService = {...carwash.smallCarWash, resourceRequirements: []};

    const theBooking = booking(customerId(), theService, date, carwash.nineToOne.slot, [])
    const outcome = resourceBookings(nineToOneToday, [theBooking], van1AvailableNineToSix) as ResourceBookingOutcome
    expect(outcome.remainingAvailability).toEqual(van1AvailableNineToSix)
})

test("does nothing if the bookings are for a different time slot", () => {
    const theBooking = booking(customerId(), carwash.smallCarWash, date, carwash.oneToFour.slot, [])
    const outcome = resourceBookings(nineToOneToday, [theBooking], van1AvailableNineToSix) as ResourceBookingOutcome
    expect(outcome.remainingAvailability).toEqual(van1AvailableNineToSix)
});

test("drops availability when capacity is exhausted", () => {
    const theBooking = booking(customerId(), carwash.smallCarWash, date, carwash.nineToOne.slot, [])
    const outcome = resourceBookings(nineToOneToday, [theBooking], van1AvailableNineToSix) as ResourceBookingOutcome
    expect(outcome.remainingAvailability).toEqual([resourceDayAvailability(carwash.van1, [availabilityBlock(dayAndTimePeriod(date, timePeriod(time24("13:00"), time24("18:00"))))])])
});

test("when the entire availability block is consumed", () => {
    const theBooking = booking(customerId(), carwash.smallCarWash, date, carwash.nineToSix, [])
    const outcome = resourceBookings(dayAndTimePeriod(date, carwash.nineToSix), [theBooking], van1AvailableNineToSix) as ResourceBookingOutcome
    expect(outcome.remainingAvailability).toEqual([resourceDayAvailability(carwash.van1, [])])
});

test("when capacity remains, the availability remains", () => {
    const theService = {...carwash.smallCarWash, capacity: capacity(2)};
    const booking1 = booking(customerId(), theService, date, carwash.nineToSix, [])
    const booking2 = booking(customerId(), theService, date, carwash.nineToSix, [])
    let outcome = resourceBookings(nineToOneToday, [booking1], van1AvailableNineToSix) as ResourceBookingOutcome
    expect(outcome.remainingAvailability).toEqual(van1AvailableNineToSix)
    outcome = resourceBookings(nineToOneToday, [booking1, booking2], van1AvailableNineToSix) as ResourceBookingOutcome
    expect(outcome.remainingAvailability).toEqual([resourceDayAvailability(carwash.van1, [availabilityBlock(dayAndTimePeriod(date, timePeriod(time24("13:00"), time24("18:00"))))])])
});

test("a booking that cuts into another two bookings", () => {
    const theService = {...carwash.smallCarWash, capacity: capacity(2)};
    const firstHalfOfDayBooking = booking(customerId(), theService, date, timePeriod(time24("09:00"), time24("13:30")), [])
    const secondHalfOfDayBooking = booking(customerId(), theService, date, timePeriod(time24("13:30"), time24("18:00")), [])
    const oneToFourBooking = booking(customerId(), theService, date, carwash.oneToFour.slot, [])
    const outcome = resourceBookings(dayAndTimePeriod(date, timePeriod(time24("13:00"), time24("14:00"))), [firstHalfOfDayBooking, secondHalfOfDayBooking, oneToFourBooking], van1AvailableNineToSix)
    if (outcome._type === 'error.response') {
        throw errorResponseFns.toError(outcome)
    }
    expect(outcome.remainingAvailability).toEqual([resourceDayAvailability(carwash.van1, [
        availabilityBlock(dayAndTimePeriod(date, timePeriod(time24("09:00"), time24("13:00")))),
        availabilityBlock(dayAndTimePeriod(date, timePeriod(time24("14:00"), time24("18:00"))))])])
})

test("booking attempt in a resource gap", () => {
    const availability = [resourceDayAvailability(carwash.van1, [
        availabilityBlock(dayAndTimePeriod(date, timePeriod(time24("09:00"), time24("13:30")))),
        availabilityBlock(dayAndTimePeriod(date, timePeriod(time24("14:00"), time24("18:00"))))])]
    const todayOneToTwo = dayAndTimePeriod(date, timePeriod(time24("13:00"), time24("14:00")))
    const oneToTwoBooking = booking(customerId(), carwash.smallCarWash, todayOneToTwo.day, todayOneToTwo.period, [])
    const outcome = resourceBookings(todayOneToTwo, [oneToTwoBooking], availability)
    expect(outcome._type).toBe('error.response')
})