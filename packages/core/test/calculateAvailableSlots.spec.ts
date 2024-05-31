import {describe, expect, test} from 'vitest'
import {
    blockedTime,
    booking,
    businessAvailability,
    BusinessConfiguration,
    businessConfiguration,
    currencies,
    customerId,
    dayAndTimePeriod,
    discreteStartTimes,
    duration,
    ErrorResponse,
    exactTimeAvailability,
    fungibleResource,
    isoDate,
    minutes,
    mondayToFriday,
    periodicStartTime,
    price,
    resourceDayAvailability,
    resourceType,
    service,
    time24,
    timePeriod,
    timeslotSpec
} from "../src/index.js";
import {makeBusinessAvailability, makeBusinessHours} from "../src/makeBusinessAvailability.js";
import {availability, startTimeFns} from "../src/availability.js";

const date = isoDate("2024-05-31")
const nineAm = time24("09:00")
const fivePm = time24("17:00")

describe("given a chatbot service that requires no resources, and is available monday to friday 9am to 5pm", () => {
    const theService = service("Chatbot Therapy", "Chatbot Therapy", [], 60, false, price(3500, currencies.GBP), [], [])
    const config = businessConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [theService],
        [],
        [],
        [],
        periodicStartTime(duration(minutes(60))),
        null)

    test("if the service takes one hour, we can do 8 services a day", () => {
        const outcome = availability.calculateAvailableSlots(config, [], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("having lots of bookings makes no difference, as no resources are required", () => {
        const expectedTimes = [time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]
        const bookings = expectedTimes.map(time => booking(customerId(), theService.id, date, exactTimeAvailability(time), "confirmed"))
        const outcome = availability.calculateAvailableSlots(config, bookings, theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual(expectedTimes)
    })

    test("if an hour is blocked out, we can do 7 services a day", () => {
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            availability: makeBusinessAvailability(makeBusinessHours(mondayToFriday, time24("09:00"), time24("17:00")), [blockedTime(date, time24("10:00"), time24("11:00"))], [date])
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("if 90 mins is blocked out across two slot boundaries, we can do 6 services a day", () => {
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            availability: makeBusinessAvailability(makeBusinessHours(mondayToFriday, time24("09:00"), time24("17:00")), [blockedTime(date, time24("09:30"), time24("11:00"))], [date])
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("if we permit starts on the half hour, we can do 15 services a day", () => {
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            startTimeSpec: periodicStartTime(duration(minutes(30)))
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("09:30"), time24("10:00"), time24("10:30"), time24("11:00"), time24("11:30"), time24("12:00"), time24("12:30"), time24("13:00"), time24("13:30"), time24("14:00"), time24("14:30"), time24("15:00"), time24("15:30"), time24("16:00")])
    })

    test("if the service takes two hours, we can do 7 services a day", () => {
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            services: config.services.map(s => ({...s, duration: 120}))
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00")])
    })

    test("discrete time specifications are honoured", () => {
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            startTimeSpec: discreteStartTimes([time24("09:00"), time24("10:00"), time24("13:00"), time24("14:00")])
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("13:00"), time24("14:00")])

    })

    test("good error message if there is no availability for the given day", () => {
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            availability: businessAvailability([])
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], theService.id, date) as ErrorResponse
        expect(outcome.errorCode).toBe(availability.errorCodes.noAvailabilityForDay)
        expect(outcome.errorMessage).toBeDefined()
    })

    test("good error message if the service cannot be found", () => {
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            services: []
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], theService.id, date) as ErrorResponse
        expect(outcome.errorCode).toBe(availability.errorCodes.serviceNotFound)
        expect(outcome.errorMessage).toBeDefined()
    })
})

describe("given a carwash service that requires one of several interchangeable washers for each service, and is available monday to friday 9am to 5pm", () => {
    const carwasher = resourceType("carWasher")
    const theService = service("Carwash", "Carwash", [carwasher], 45, false, price(3500, currencies.GBP), [], [])
    const config = businessConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [theService],
        [],
        [],
        [],
        periodicStartTime(duration(minutes(60))),
        null)

    test("there is no availability where there are no resources", () => {
        const outcome = availability.calculateAvailableSlots(config, [], theService.id, date) as ErrorResponse
        expect(outcome.errorCode).toBe(availability.errorCodes.noResourcesAvailable)
        expect(outcome.errorMessage).toBeDefined()
    })

    test("we have availability when we have one resource", () => {
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(fungibleResource(carwasher, "Washer#1"), [dayAndTimePeriod(date, timePeriod(nineAm, fivePm))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("we lose availability when a booking takes all the resources", () => {
        const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(time24("10:00")), "confirmed")
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(fungibleResource(carwasher, "Washer#1"), [dayAndTimePeriod(date, timePeriod(nineAm, fivePm))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [theBooking], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("we keep availability when a booking takes a resource, but there are extra resources available", () => {
        const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(time24("10:00")), "confirmed")
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            resourceAvailability: [
                resourceDayAvailability(fungibleResource(carwasher, "Washer#1"), [dayAndTimePeriod(date, timePeriod(nineAm, fivePm))]),
                resourceDayAvailability(fungibleResource(carwasher, "Washer#1"), [dayAndTimePeriod(date, timePeriod(nineAm, fivePm))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [theBooking], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })
});

describe("given a mobile carwash service that requires one of several interchangeable vans for each service, and books against time slots, and is available monday to friday 9am to 5pm", () => {
    const van = resourceType("Van")
    const theService = service("Mobile Carwash", "Mobile Carwash", [van], 120, true, price(3500, currencies.GBP), [], [])
    const morningSlot = timeslotSpec(nineAm, time24("12:00"), "morning slot");
    const afternoonSlot = timeslotSpec(time24("13:00"), time24("16:00"), "afternoon slot");
    const config = businessConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [theService],
        [],
        [morningSlot, afternoonSlot],
        [],
        periodicStartTime(duration(minutes(60))),
        null)

    test("there is no availability where there are no resources", () => {
        const outcome = availability.calculateAvailableSlots(config, [], theService.id, date) as ErrorResponse
        expect(outcome.errorCode).toBe(availability.errorCodes.noResourcesAvailable)
        expect(outcome.errorMessage).toBeDefined()
    })

    test("we have availability when we have one resource", () => {
        const mutatedConfig: BusinessConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(fungibleResource(van, "Van#1"), [dayAndTimePeriod(date, timePeriod(nineAm, fivePm))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("13:00")])
    })

    test("we lose availability when a booking takes all the resources", () => {
        const theBooking = booking(customerId(), theService.id, date, morningSlot, "confirmed")

        const mutatedConfig: BusinessConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(fungibleResource(van, "Van#1"), [dayAndTimePeriod(date, timePeriod(nineAm, fivePm))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [theBooking], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("13:00")])
    })
    test("we keep availability when a booking takes a resource, but there are extra resources available", () => {
        const theBooking = booking(customerId(), theService.id, date, morningSlot, "confirmed")

        const mutatedConfig: BusinessConfiguration = {
            ...config,
            resourceAvailability: [
                resourceDayAvailability(fungibleResource(van, "Van#1"), [dayAndTimePeriod(date, timePeriod(nineAm, fivePm))]),
                resourceDayAvailability(fungibleResource(van, "Van#2"), [dayAndTimePeriod(date, timePeriod(nineAm, fivePm))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [theBooking], theService.id, date)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("13:00")])
    })
})
