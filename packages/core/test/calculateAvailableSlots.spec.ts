import {describe, expect, test} from 'vitest'
import {
    availability,
    availabilityBlock,
    AvailabilityConfiguration,
    availabilityConfiguration,
    blockedTime,
    booking,
    businessAvailability,
    capacity,
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
    resourceAssignment,
    resourceDayAvailability,
    resourceDayAvailabilityFns,
    resourceType,
    service,
    serviceFns,
    serviceOption,
    serviceRequest,
    startTimeFns,
    time24,
    timePeriod,
    timeslotSpec
} from "../src/index.js";
import {makeBusinessAvailability, makeBusinessHours} from "../src/makeBusinessAvailability.js";

const date = isoDate("2024-05-31")
const nineAm = time24("09:00")
const fivePm = time24("17:00")

describe("given a chatbot service that requires no resources, and is available monday to friday 9am to 5pm", () => {
    const theService = service("Chatbot Therapy", "Chatbot Therapy", [], 60, false, price(3500, currencies.GBP), [], [])
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))))

    test("if the service takes one hour, we can do 8 services a day", () => {
        const outcome = availability.calculateAvailableSlots(config, [], serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("having lots of bookings makes no difference, as no resources are required", () => {
        const expectedTimes = [time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]
        const bookings = expectedTimes.map(time => booking(customerId(), theService.id, date, exactTimeAvailability(time), [], "confirmed"))
        const outcome = availability.calculateAvailableSlots(config, bookings, serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual(expectedTimes)
    })

    test("if an hour is blocked out, we can do 7 services a day", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            availability: makeBusinessAvailability(makeBusinessHours(mondayToFriday, time24("09:00"), time24("17:00")), [blockedTime(date, time24("10:00"), time24("11:00"))], [date])
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("if 90 mins is blocked out across two slot boundaries, we can do 6 services a day", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            availability: makeBusinessAvailability(makeBusinessHours(mondayToFriday, time24("09:00"), time24("17:00")), [blockedTime(date, time24("09:30"), time24("11:00"))], [date])
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("if we permit starts on the half hour, we can do 15 services a day", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            startTimeSpec: periodicStartTime(duration(minutes(30)))
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("09:30"), time24("10:00"), time24("10:30"), time24("11:00"), time24("11:30"), time24("12:00"), time24("12:30"), time24("13:00"), time24("13:30"), time24("14:00"), time24("14:30"), time24("15:00"), time24("15:30"), time24("16:00")])
    })

    test("if the service takes two hours, we can do 7 services a day", () => {
        const longerService = {...theService, duration: 120}
        const outcome = availability.calculateAvailableSlots(config, [], serviceRequest(longerService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00")])
    })

    test("discrete time specifications are honoured", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            startTimeSpec: discreteStartTimes([time24("09:00"), time24("10:00"), time24("13:00"), time24("14:00")])
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }
        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("13:00"), time24("14:00")])

    })

    test("good error message if there is no availability for the given day", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            availability: businessAvailability([])
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)) as ErrorResponse
        expect(outcome.errorCode).toBe(availability.errorCodes.noAvailabilityForDay)
        expect(outcome.errorMessage).toBeDefined()
    })
})

describe("given a carwash service that requires one of several interchangeable washers for each service, and is available monday to friday 9am to 5pm", () => {
    const carwasher = resourceType("carWasher")
    const theService = service("Carwash", "Carwash", [carwasher], 45, false, price(3500, currencies.GBP), [], [])
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))))

    test("there is no availability where there are no resources", () => {
        const outcome = availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)) as ErrorResponse
        expect(outcome.errorCode).toBe(availability.errorCodes.noResourcesAvailable)
        expect(outcome.errorMessage).toBeDefined()
    })

    test("we have availability when we have one resource", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(fungibleResource(carwasher, "Washer#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("we lose availability when a booking takes all the resources", () => {
        const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(time24("10:00")), [], "confirmed")
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(fungibleResource(carwasher, "Washer#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("we keep availability when a booking takes a resource, but there are extra resources available", () => {
        const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(time24("10:00")), [], "confirmed")
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [
                resourceDayAvailability(fungibleResource(carwasher, "Washer#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
                resourceDayAvailability(fungibleResource(carwasher, "Washer#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date))
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
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [morningSlot, afternoonSlot],
        periodicStartTime(duration(minutes(60))))

    test("there is no availability where there are no resources", () => {
        const outcome = availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)) as ErrorResponse
        expect(outcome.errorCode).toBe(availability.errorCodes.noResourcesAvailable)
        expect(outcome.errorMessage).toBeDefined()
    })

    test("we have availability when we have one resource", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(fungibleResource(van, "Van#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("13:00")])
    })

    test("we lose availability when a booking takes all the resources", () => {
        const theBooking = booking(customerId(), theService.id, date, morningSlot, [], "confirmed")

        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(fungibleResource(van, "Van#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("13:00")])
    })
    test("we keep availability when a booking takes a resource, but there are extra resources available", () => {
        const theBooking = booking(customerId(), theService.id, date, morningSlot, [], "confirmed")

        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [
                resourceDayAvailability(fungibleResource(van, "Van#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
                resourceDayAvailability(fungibleResource(van, "Van#2"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date))
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("13:00")])
    })
})

describe("given a gym that offers personal training with specific trainers, and is available monday to friday 9am to 5pm", () => {
    const personalTrainer = resourceType("personalTrainer")
    const ptMike = fungibleResource(personalTrainer, "ptMike")
    const ptMete = fungibleResource(personalTrainer, "ptMete")
    const bothPtsAvailable = [resourceDayAvailability(ptMike, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]), resourceDayAvailability(ptMete, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
    const theService = service("Personal Training", "Personal Training", [personalTrainer], 55, false, price(3500, currencies.GBP), [], [])
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))))

    test("there is no availability where there are no personal trainers", () => {
        const outcome = availability.calculateAvailableSlotsForResource(config, [], serviceRequest(theService, date), ptMike.id) as ErrorResponse
        expect(outcome.errorCode).toBe(availability.errorCodes.noResourcesAvailable)
        expect(outcome.errorMessage).toBeDefined()
    })

    test("we have availability when the pt available", () => {
        const mutatedConfig: AvailabilityConfiguration = {...config, resourceAvailability: bothPtsAvailable}
        const outcome = availability.calculateAvailableSlotsForResource(mutatedConfig, [], serviceRequest(theService, date), ptMike.id)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("we lose availability when a booking takes the pt", () => {
        const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(ptMike.id)], "confirmed")

        const mutatedConfig: AvailabilityConfiguration = {...config, resourceAvailability: bothPtsAvailable}
        const outcome = availability.calculateAvailableSlotsForResource(mutatedConfig, [theBooking], serviceRequest(theService, date), ptMike.id)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("we keep availability when a booking takes the a different pt", () => {
        const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(ptMete.id)], "confirmed")
        const mutatedConfig: AvailabilityConfiguration = {...config, resourceAvailability: bothPtsAvailable}

        const outcome = availability.calculateAvailableSlotsForResource(mutatedConfig, [theBooking], serviceRequest(theService, date), ptMike.id)
        if (outcome._type === 'error.response') {
            throw new Error(outcome.errorCode)
        }

        const available = outcome.value
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })
});

describe("given a gym that offers personal training requiring a specific trainer and a specific gym room, and is available monday to friday 9am to 5pm", () => {
    const personalTrainer = resourceType("personalTrainer");
    const gymRoom = resourceType("gymRoom");
    const ptMike = fungibleResource(personalTrainer, "ptMike");
    const ptMete = fungibleResource(personalTrainer, "ptMete");
    const roomA = fungibleResource(gymRoom, "roomA");
    const requiredResources = [
        resourceDayAvailability(ptMike, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(ptMete, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(roomA, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
    ];
    const theService = service("Personal Training", "Personal Training", [personalTrainer, gymRoom], 55, false, price(3500, currencies.GBP), [], []);
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))),
    );

    test("there is no availability when either the personal trainer or the gym room is unavailable", () => {
        const trainerOnlyConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: resourceDayAvailabilityFns.reduceToResource(requiredResources, ptMike.id),
        };
        const trainerOnlyOutcome = availability.calculateAvailableSlots(trainerOnlyConfig, [], serviceRequest(theService, date)) as ErrorResponse;
        expect(trainerOnlyOutcome.errorCode).toBe(availability.errorCodes.noResourcesAvailable);
        expect(trainerOnlyOutcome.errorMessage).toBeDefined();

        const roomOnlyConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: resourceDayAvailabilityFns.reduceToResource(requiredResources, roomA.id),
        };
        const roomOnlyOutcome = availability.calculateAvailableSlots(roomOnlyConfig, [], serviceRequest(theService, date)) as ErrorResponse;
        expect(roomOnlyOutcome.errorCode).toBe(availability.errorCodes.noResourcesAvailable);
        expect(roomOnlyOutcome.errorMessage).toBeDefined();
    });

    test("we have availability when both the personal trainer and the gym room are available", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date));
        if (outcome._type === "error.response") {
            throw new Error(outcome.errorCode);
        }

        const available = outcome.value;
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    });

    test("we lose availability when a booking takes either the personal trainer or the gym room", () => {
        const trainerBooking = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(ptMete.id), resourceAssignment(roomA.id)], "confirmed");
        const roomBooking = booking(customerId(), theService.id, date, exactTimeAvailability(time24("10:00")), [resourceAssignment(ptMike.id), resourceAssignment(roomA.id)], "confirmed");

        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };

        const trainerBookingOutcome = availability.calculateAvailableSlots(mutatedConfig, [trainerBooking, roomBooking], serviceRequest(theService, date));
        if (trainerBookingOutcome._type === "error.response") {
            throw new Error(trainerBookingOutcome.errorCode);
        }
        const trainerBookingAvailable = trainerBookingOutcome.value;
        const trainerBookingTimes = trainerBookingAvailable.map((a) => startTimeFns.toTime24(a.startTime));
        expect(trainerBookingTimes).toEqual([time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    });
});

describe("given a dog walking service that can take up to 6 dogs at 09.00, and is open monday to friday", () => {
    const dogIntake = resourceType("dogs", true);
    const sixDogs = fungibleResource(dogIntake, "Dog")
    const requiredResources = [
        resourceDayAvailability(sixDogs, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)), capacity(6))]),
    ];
    const theService = service("Dog Walk", "Dog Walk", [dogIntake], 480, false, price(3500, currencies.GBP), [], []);
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        discreteStartTimes([time24("09:00")]),
    );

    test("there is no availability when we have no resources", () => {
        const outcome = availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)) as ErrorResponse;
        expect(outcome.errorCode).toBe(availability.errorCodes.noResourcesAvailable);
        expect(outcome.errorMessage).toBeDefined();
    });

    test("there is availability when we have the resource", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date));
        if (outcome._type === "error.response") {
            throw new Error(outcome.errorCode);
        }

        const available = outcome.value;
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00")]);
    });

    test("there is availability is we have some bookings, but capacity remains", () => {
        const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(sixDogs.id, capacity(5))], "confirmed");
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const outcome = availability.calculateAvailableSlotsForResource(mutatedConfig, [theBooking], serviceRequest(theService, date), sixDogs.id);
        if (outcome._type === "error.response") {
            throw new Error(outcome.errorCode);
        }

        const available = outcome.value;
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00")]);
    });

    test("there is no availability when we have bookings that use all the capacity", () => {
        const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(sixDogs.id, capacity(6))], "confirmed");
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const outcome = availability.calculateAvailableSlotsForResource(mutatedConfig, [theBooking], serviceRequest(theService, date), sixDogs.id);
        if (outcome._type === "error.response") {
            throw new Error(outcome.errorCode);
        }

        const available = outcome.value;
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([]);
    });

    test("capacity consumption is tracked across the aggregate of bookings", () => {
        const fourDogs = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(sixDogs.id, capacity(4))], "confirmed");
        const oneDog = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(sixDogs.id, capacity(1))], "confirmed");
        const oneMoreDog = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(sixDogs.id, capacity(1))], "confirmed");
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const outcome = availability.calculateAvailableSlotsForResource(mutatedConfig, [fourDogs, oneDog], serviceRequest(theService, date), sixDogs.id);
        if (outcome._type === "error.response") {
            throw new Error(outcome.errorCode);
        }

        expect(outcome.value.map((a) => startTimeFns.toTime24(a.startTime))).toEqual([time24("09:00")]);

        const outcome2 = availability.calculateAvailableSlotsForResource(mutatedConfig, [fourDogs, oneDog, oneMoreDog], serviceRequest(theService, date), sixDogs.id);
        if (outcome2._type === "error.response") {
            throw new Error(outcome2.errorCode);
        }

        expect(outcome2.value.map((a) => startTimeFns.toTime24(a.startTime))).toEqual([]);
    });
});

describe("given a hair salon that offers configurable services, and is available monday to friday 9am to 5pm", () => {
    const hairStylist = resourceType("hairStylist");
    const colouringMachine = resourceType("colouringMachine");
    const mikeStylist = fungibleResource(hairStylist, "Mike");
    const meteStylist = fungibleResource(hairStylist, "Mete");
    const colouringMachine1 = fungibleResource(colouringMachine, "Colouring Machine 1");
    const requiredResources = [
        resourceDayAvailability(mikeStylist, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(meteStylist, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(colouringMachine1, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
    ];
    const colouring = serviceOption("Colouring", "Colouring", price(1500, currencies.GBP), false, duration(minutes(20)), [colouringMachine], []);
    const cutting = serviceOption("Cutting", "Cutting", price(2000, currencies.GBP), false, duration(minutes(30)), [], []);
    const curling = serviceOption("Curling", "Curling", price(2500, currencies.GBP), false, duration(minutes(40)), [], []);
    const theService = serviceFns.addOptions(service("Hair styling", "Hair styling", [hairStylist], 30, false, price(3500, currencies.GBP), [], []), [colouring, cutting, curling]);
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))),
    );

    test("there is no availability when we have no resources", () => {
        const outcome = availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)) as ErrorResponse;
        expect(outcome.errorCode).toBe(availability.errorCodes.noResourcesAvailable);
        expect(outcome.errorMessage).toBeDefined();
    });

    test("there is availability when we have the resources", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date));
        if (outcome._type === "error.response") {
            throw new Error(outcome.errorCode);
        }

        const available = outcome.value;
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    });
});

describe("given a yoga studio with two instructors and two rooms", () => {
    const room = resourceType("room", true);
    const instructor = resourceType("instructor", false);
    const smallRoom = fungibleResource(room, "Small Room");
    const largeRoom = fungibleResource(room, "Large Room");
    const mikeInstructor = fungibleResource(instructor, "Mike");
    const meteInstructor = fungibleResource(instructor, "Mete");
    const requiredResources = [
        resourceDayAvailability(smallRoom, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)), capacity(10))]),
        resourceDayAvailability(largeRoom, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)), capacity(18))]),
        resourceDayAvailability(mikeInstructor, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(meteInstructor, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
    ];
    const theService = service("Yoga", "Yoga", [room, instructor], 60, false, price(3500, currencies.GBP), [], []);
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))),
    );

    test("there is no availability when we have no resources", () => {
        const outcome = availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)) as ErrorResponse;
        expect(outcome.errorCode).toBe(availability.errorCodes.noResourcesAvailable);
        expect(outcome.errorMessage).toBeDefined();
    });

    test("there is availability when we have the resources", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date));
        if (outcome._type === "error.response") {
            throw new Error(outcome.errorCode);
        }

        const available = outcome.value;
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    });

    test("we have availability if we have only one booking", () => {
        const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(smallRoom.id, capacity(1)), resourceAssignment(mikeInstructor.id)], "confirmed");
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const outcome = availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date));
        if (outcome._type === "error.response") {
            throw new Error(`${outcome.errorCode}: ${outcome.errorMessage ?? ""}`);
        }

        const available = outcome.value;
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    });

    // test("we have no availability if the room is full", () => {
    //     const theBooking = booking(customerId(), theService.id, date, exactTimeAvailability(nineAm), [resourceAssignment(smallRoom.id, capacity(10)), resourceAssignment(mikeInstructor.id)], "confirmed");
    //     const mutatedConfig: AvailabilityConfiguration = {
    //         ...config,
    //         resourceAvailability: requiredResources,
    //     };
    //     const outcome = availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date));
    //     if (outcome._type === "error.response") {
    //         throw new Error(`${outcome.errorCode}: ${outcome.errorMessage ?? ""}`);
    //     }
    //
    //     const available = outcome.value;
    //     const times = available.map((a) => startTimeFns.toTime24(a.startTime));
    //     expect(times).toEqual([time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    // });
})

