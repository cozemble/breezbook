import {describe, expect, test} from 'vitest'
import {
    anySuitableResource,
    availability,
    availabilityBlock,
    AvailabilityConfiguration,
    availabilityConfiguration,
    AvailableSlot,
    blockedTime,
    Booking,
    booking,
    businessAvailability,
    capacity,
    currencies,
    customerId,
    dayAndTimePeriod,
    discreteStartTimes,
    duration,
    ErrorResponse,
    errorResponseFns,
    fixedResourceAllocation,
    isoDate,
    minutes,
    mondayToFriday,
    periodicStartTime,
    price,
    resource,
    ResourceDayAvailability,
    resourceDayAvailability,
    resourceDayAvailabilityFns,
    resourceRequirementId,
    resourceType,
    service,
    serviceFns,
    serviceOption,
    ServiceRequest,
    serviceRequest,
    specificResource,
    startTimeFns,
    Success,
    time24,
    time24Fns,
    timePeriod,
    timeslotSpec
} from "../src/index.js";
import {makeBusinessAvailability, makeBusinessHours} from "../src/makeBusinessAvailability.js";

const date = isoDate("2024-05-31")
const nineAm = time24("09:00")
const fivePm = time24("17:00")

describe("given a chatbot service that requires no resources, and is available monday to friday 9am to 5pm", () => {
    const theService = service("Chatbot Therapy", "Chatbot Therapy", [], minutes(60), price(3500, currencies.GBP), [], [])
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))))

    test("if the service takes one hour, we can do 8 services a day", () => {
        const available = expectSlots(availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("having lots of bookings makes no difference, as no resources are required", () => {
        const expectedTimes = [time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]
        const bookings = expectedTimes.map(time => booking(customerId(), theService, date, timePeriod(time, time24Fns.addMinutes(time, minutes(60)))))
        const available = expectSlots(availability.calculateAvailableSlots(config, bookings, serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual(expectedTimes)
    })

    test("if an hour is blocked out, we can do 7 services a day", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            availability: makeBusinessAvailability(makeBusinessHours(mondayToFriday, time24("09:00"), time24("17:00")), [blockedTime(date, time24("10:00"), time24("11:00"))], [date])
        }
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("if 90 mins is blocked out across two slot boundaries, we can do 6 services a day", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            availability: makeBusinessAvailability(makeBusinessHours(mondayToFriday, time24("09:00"), time24("17:00")), [blockedTime(date, time24("09:30"), time24("11:00"))], [date])
        }
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("if we permit starts on the half hour, we can do 15 services a day", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            startTimeSpec: periodicStartTime(duration(minutes(30)))
        }
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("09:30"), time24("10:00"), time24("10:30"), time24("11:00"), time24("11:30"), time24("12:00"), time24("12:30"), time24("13:00"), time24("13:30"), time24("14:00"), time24("14:30"), time24("15:00"), time24("15:30"), time24("16:00")])
    })

    test("if the service takes two hours, we can do 7 services a day", () => {
        const longerService = {...theService, duration: minutes(120)}
        const available = expectSlots(availability.calculateAvailableSlots(config, [], serviceRequest(longerService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00")])
    })

    test("discrete time specifications are honoured", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            startTimeSpec: discreteStartTimes([time24("09:00"), time24("10:00"), time24("13:00"), time24("14:00")])
        }
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)))
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

function expectSlots(outcome: Success<AvailableSlot[]> | ErrorResponse): AvailableSlot[] {
    expect(outcome._type).toBe("success")
    if (outcome._type === "error.response") {
        throw errorResponseFns.toError(outcome)
    }
    return outcome.value

}

describe("given a carwash service that requires one of several interchangeable washers for each service, and is available monday to friday 9am to 5pm", () => {
    const carwasher = resourceType("carWasher")
    const theService = service("Carwash", "Carwash", [anySuitableResource(carwasher)], minutes(45), price(3500, currencies.GBP), [], [])
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))))

    test("there is no availability where there are no resources", () => {
        const slots = expectSlots(availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)))
        expect(slots).toHaveLength(0)
    })

    test("we have availability when we have one resource", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(resource(carwasher, "Washer#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("we lose availability when a booking takes all the resources", () => {
        const theBooking = booking(customerId(), theService, date, timePeriod(time24("10:00"), time24("11:00")))
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(resource(carwasher, "Washer#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("we keep availability when a booking takes a resource, but there are extra resources available", () => {
        const theBooking = booking(customerId(), theService, date, timePeriod(time24("10:00"), time24("11:00")))
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [
                resourceDayAvailability(resource(carwasher, "Washer#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
                resourceDayAvailability(resource(carwasher, "Washer#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })
});

describe("given a mobile carwash service that requires one of several interchangeable vans for each service, and books against time slots, and is available monday to friday 9am to 5pm", () => {
    const van = resourceType("Van")
    const morningSlot = timeslotSpec(nineAm, time24("12:00"), "morning slot");
    const afternoonSlot = timeslotSpec(time24("13:00"), time24("16:00"), "afternoon slot");
    const theService = serviceFns.setStartTimes(service("Mobile Carwash", "Mobile Carwash", [anySuitableResource(van)], minutes(120), price(3500, currencies.GBP), [], []), [morningSlot, afternoonSlot])
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [morningSlot, afternoonSlot],
        periodicStartTime(duration(minutes(60))))

    test("there is no availability where there are no resources", () => {
        const outcome = expectSlots(availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)))
        expect(outcome).toHaveLength(0)
    })

    test("we have availability when we have one resource", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(resource(van, "Van#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("13:00")])
    })

    test("we lose availability when a booking takes all the resources", () => {
        const theBooking = booking(customerId(), theService, date, morningSlot.slot)

        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [resourceDayAvailability(resource(van, "Van#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("13:00")])
    })
    test("we keep availability when a booking takes a resource, but there are extra resources available", () => {
        const theBooking = booking(customerId(), theService, date, morningSlot.slot)

        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: [
                resourceDayAvailability(resource(van, "Van#1"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
                resourceDayAvailability(resource(van, "Van#2"), [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
        }
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("13:00")])
    })
})

describe("given a gym that offers personal training with specific trainers, and is available monday to friday 9am to 5pm", () => {
    const personalTrainer = resourceType("personalTrainer")
    const ptMike = resource(personalTrainer, "ptMike")
    const ptMete = resource(personalTrainer, "ptMete")
    const bothPtsAvailable = [resourceDayAvailability(ptMike, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]), resourceDayAvailability(ptMete, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])]
    const requiresPtMike = specificResource(ptMike)
    const theService = service("Personal Training", "Personal Training", [requiresPtMike], minutes(55), price(3500, currencies.GBP), [], [])
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))))

    test("there is no availability where there are no personal trainers", () => {
        const outcome = expectSlots(availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)))
        expect(outcome).toHaveLength(0)
    })

    test("we have availability when the pt available", () => {
        const mutatedConfig: AvailabilityConfiguration = {...config, resourceAvailability: bothPtsAvailable}
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("we lose availability when a booking takes the pt", () => {
        const theBooking = booking(customerId(), theService, date, timePeriod(nineAm, time24("09:55")), capacity(1), [fixedResourceAllocation(requiresPtMike.id, ptMike.id)])

        const mutatedConfig: AvailabilityConfiguration = {...config, resourceAvailability: bothPtsAvailable}
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })

    test("we keep availability when a booking takes the a different pt", () => {
        const theBooking = booking(customerId(), theService, date, timePeriod(nineAm, time24("09:55")), capacity(1), [fixedResourceAllocation(requiresPtMike.id, ptMete.id)])
        const mutatedConfig: AvailabilityConfiguration = {...config, resourceAvailability: bothPtsAvailable}

        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date)))
        const times = available.map(a => startTimeFns.toTime24(a.startTime))
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")])
    })
});

function expectNoAvailability(config: AvailabilityConfiguration, serviceRequest: ServiceRequest, bookings: Booking[] = []) {
    const outcome = availability.calculateAvailableSlots(config, bookings, serviceRequest)
    if (outcome._type === "error.response") {
        throw errorResponseFns.toError(outcome)
    }

    expect(outcome._type).toBe("success")
    expect(outcome.value).toHaveLength(0)
}

function setAvailability(config: AvailabilityConfiguration, resources: ResourceDayAvailability[]): AvailabilityConfiguration {
    return {...config, resourceAvailability: resources}
}

describe("given a medical centre and an appointment type that requires two doctors", () => {
    const doctor = resourceType("doctor")
    const examinationRoom = resourceType("examinationRoom")
    const doctorMike = resource(doctor, "doctorMike")
    const doctorMete = resource(doctor, "doctorMete")
    const doctorNo = resource(doctor, "doctorNo")
    const roomA = resource(examinationRoom, "roomA")
    const roomB = resource(examinationRoom, "roomB")
    const doctorMikeAvailability = resourceDayAvailability(doctorMike, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])
    const doctorMeteAvailability = resourceDayAvailability(doctorMete, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])
    const roomAAvailability = resourceDayAvailability(roomA, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])
    const roomBAvailability = resourceDayAvailability(roomB, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))])
    const lead = resourceRequirementId('lead');
    const assistant = resourceRequirementId('assistant');
    const theService = service("Consultation", "Consultation", [anySuitableResource(doctor, lead), anySuitableResource(doctor, assistant), anySuitableResource(examinationRoom)], minutes(60), price(3500, currencies.GBP), [], [])
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))))

    test("there is no availability when there is insufficient resource", () => {
        expectNoAvailability(config, serviceRequest(theService, date))
        expectNoAvailability(setAvailability(config, [doctorMikeAvailability]), serviceRequest(theService, date))
        expectNoAvailability(setAvailability(config, [doctorMeteAvailability]), serviceRequest(theService, date))
        expectNoAvailability(setAvailability(config, [roomAAvailability]), serviceRequest(theService, date))
        expectNoAvailability(setAvailability(config, [roomBAvailability]), serviceRequest(theService, date))
        expectNoAvailability(setAvailability(config, [doctorMikeAvailability, doctorMeteAvailability]), serviceRequest(theService, date))
        expectNoAvailability(setAvailability(config, [roomAAvailability, roomAAvailability]), serviceRequest(theService, date))
        expectNoAvailability(setAvailability(config, [doctorMeteAvailability, roomAAvailability]), serviceRequest(theService, date))
    })

    test("one doctor can be specified explictly", () => {
        const mutatedConfig = setAvailability(config, [doctorMikeAvailability, doctorMeteAvailability, roomAAvailability, roomBAvailability])
        const mutatedService = serviceFns.replaceRequirement(theService, anySuitableResource(doctor, lead), specificResource(doctorMike, lead))
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(mutatedService, date)))
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        const leadDoctorIds = Array.from(new Set(available.map((a) => a.resourceAllocation.find((r) => r.requirement.id === lead)?.resource.id.value)))
        expect(leadDoctorIds).toEqual([doctorMike.id.value])
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    })

    test("both doctors can be specified explictly", () => {
        const mutatedConfig = setAvailability(config, [doctorMikeAvailability, doctorMeteAvailability, roomAAvailability, roomBAvailability])
        const mutatedService = serviceFns.replaceRequirement(serviceFns.replaceRequirement(theService, anySuitableResource(doctor, lead), specificResource(doctorMike, lead)), anySuitableResource(doctor, assistant), specificResource(doctorMete, assistant))
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(mutatedService, date)))
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        const leadDoctorIds = Array.from(new Set(available.map((a) => a.resourceAllocation.find((r) => r.requirement.id === lead)?.resource.id.value)))
        expect(leadDoctorIds).toEqual([doctorMike.id.value])
        const assistantDoctorIds = Array.from(new Set(available.map((a) => a.resourceAllocation.find((r) => r.requirement.id === assistant)?.resource.id.value)))
        expect(assistantDoctorIds).toEqual([doctorMete.id.value])
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    })

    test("specifying a doctor that is not resourced results in no availability", () => {
        const mutatedConfig = setAvailability(config, [doctorMikeAvailability, doctorMeteAvailability, roomAAvailability, roomBAvailability])
        const mutatedService = serviceFns.replaceRequirement(theService, anySuitableResource(doctor, lead), specificResource(doctorNo))
        expectNoAvailability(mutatedConfig, serviceRequest(mutatedService, date))
    });
})

describe("given a gym that offers personal training requiring a specific trainer and a specific gym room, and is available monday to friday 9am to 5pm", () => {
    const personalTrainer = resourceType("personalTrainer");
    const gymRoom = resourceType("gymRoom");
    const ptMike = resource(personalTrainer, "ptMike");
    const ptMete = resource(personalTrainer, "ptMete");
    const roomA = resource(gymRoom, "roomA");
    const requiredResources = [
        resourceDayAvailability(ptMike, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(ptMete, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(roomA, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
    ];
    const theService = service("Personal Training", "Personal Training", [anySuitableResource(personalTrainer), anySuitableResource(gymRoom)], minutes(55), price(3500, currencies.GBP), [], []);
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
        const trainerOnlyOutcome = expectSlots(availability.calculateAvailableSlots(trainerOnlyConfig, [], serviceRequest(theService, date)))
        expect(trainerOnlyOutcome).toHaveLength(0);

        const roomOnlyConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: resourceDayAvailabilityFns.reduceToResource(requiredResources, roomA.id),
        };
        const roomOnlyOutcome = expectSlots(availability.calculateAvailableSlots(roomOnlyConfig, [], serviceRequest(theService, date)));
        expect(roomOnlyOutcome).toHaveLength(0);
    });

    test("we have availability when both the personal trainer and the gym room are available", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)));
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    });

    test("we lose availability when a booking takes either the personal trainer or the gym room", () => {
        const trainerBooking = booking(customerId(), theService, date, timePeriod(nineAm, time24("09:55")));
        const roomBooking = booking(customerId(), theService, date, timePeriod(time24("10:00"), time24("10:55")));

        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };

        const trainerBookingAvailable = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [trainerBooking, roomBooking], serviceRequest(theService, date)));
        const trainerBookingTimes = trainerBookingAvailable.map((a) => startTimeFns.toTime24(a.startTime));
        expect(trainerBookingTimes).toEqual([time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    });
});

describe("given a dog walking service that can take up to 6 dogs at 09.00, and is open monday to friday", () => {
    const dogIntake = resourceType("dogs");
    const sixDogs = resource(dogIntake, "Dog")
    const requiredResources = [
        resourceDayAvailability(sixDogs, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
    ];
    const theService = service("Dog Walk", "Dog Walk", [anySuitableResource(dogIntake)], minutes(480), price(3500, currencies.GBP), [], [], capacity(6));
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        discreteStartTimes([time24("09:00")]),
    );

    test("there is no availability when we have no resources", () => {
        const available = expectSlots(availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)))
        expect(available).toHaveLength(0);
    });

    test("there is availability when we have the resource", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)));
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00")]);
    });

    test("there is availability if we have some bookings, but capacity remains", () => {
        const theBooking = booking(customerId(), theService, date, timePeriod(nineAm, fivePm), capacity(5));
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date)));
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00")]);
    });

    test("there is no availability when we have bookings that use all the capacity", () => {
        const theBooking = booking(customerId(), theService, date, timePeriod(nineAm, fivePm), capacity(6));
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date)));
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([]);
    });

    test("capacity consumption is tracked across the aggregate of bookings", () => {
        const fourDogs = booking(customerId(), theService, date, timePeriod(nineAm, fivePm), capacity(4));
        const oneDog = booking(customerId(), theService, date, timePeriod(nineAm, fivePm), capacity(1));
        const oneMoreDog = booking(customerId(), theService, date, timePeriod(nineAm, fivePm), capacity(1));
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [fourDogs, oneDog], serviceRequest(theService, date)));

        expect(available.map((a) => startTimeFns.toTime24(a.startTime))).toEqual([time24("09:00")]);

        const outcome2 = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [fourDogs, oneDog, oneMoreDog], serviceRequest(theService, date)));
        expect(outcome2.map((a) => startTimeFns.toTime24(a.startTime))).toEqual([]);
    });
});

describe("given a hair salon that offers configurable services, and is available monday to friday 9am to 5pm", () => {
    const hairStylist = resourceType("hairStylist");
    const colouringMachine = resourceType("colouringMachine");
    const someSharedResource = resourceType("sharedResource")
    const mikeStylist = resource(hairStylist, "Mike");
    const meteStylist = resource(hairStylist, "Mete");
    const colouringMachine1 = resource(colouringMachine, "Colouring Machine 1");
    const sharedResource1 = resource(someSharedResource, "Shared Resource");
    const stylistsAvailable = [
        resourceDayAvailability(mikeStylist, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(meteStylist, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
    ];
    const colouring = serviceOption("Colouring", "Colouring", price(1500, currencies.GBP), false, duration(minutes(20)), [anySuitableResource(colouringMachine)], []);
    const cutting = serviceOption("Cutting", "Cutting", price(2000, currencies.GBP), false, duration(minutes(30)), [anySuitableResource(someSharedResource)], []);
    const curling = serviceOption("Curling", "Curling", price(2500, currencies.GBP), false, duration(minutes(40)), [anySuitableResource(someSharedResource)], []);
    const theService = serviceFns.addOptions(service("Hair styling", "Hair styling", [anySuitableResource(hairStylist)], minutes(30), price(3500, currencies.GBP), [], []), [colouring, cutting, curling]);
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))),
    );

    test("there is no availability when we have no resources", () => {
        const outcome = expectSlots(availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)));
        expect(outcome).toHaveLength(0);
    });

    test("there is availability when we have the resources", () => {
        const mutatedConfig = setAvailability(config, stylistsAvailable);
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)));
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    });

    test("adding a service option that lengthens the service, reduces the number of available slots", () => {
        const sharedResourceAvailable = resourceDayAvailability(sharedResource1, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]);
        const mutatedConfig = setAvailability(config, [...stylistsAvailable, sharedResourceAvailable]);
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date, [curling])));
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00")]);
    });

    test("adding a service option that requires a resource, drops availabilty when the resource is not available", () => {
        const colouringMachineAvailableNineToEleven = resourceDayAvailability(colouringMachine1, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, time24("11:00"))))]);
        const mutatedConfig = setAvailability(config, [...stylistsAvailable, colouringMachineAvailableNineToEleven]);
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date, [colouring])));
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00"), time24("10:00")]);
    });

    test("service option resource requirements are reduced to the min required", () => {
        const sharedResourceAvailableNineToTwelve = resourceDayAvailability(sharedResource1, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, time24("12:00"))))]);
        const mutatedConfig = setAvailability(config, [...stylistsAvailable, sharedResourceAvailableNineToTwelve]);
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date, [curling, cutting])));
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00"), time24("10:00")]);
    })
});

describe("given a yoga studio with two instructors and two rooms", () => {
    const room = resourceType("room");
    const instructor = resourceType("instructor");
    const smallRoom = resource(room, "Small Room");
    const largeRoom = resource(room, "Large Room");
    const mikeInstructor = resource(instructor, "Mike");
    const meteInstructor = resource(instructor, "Mete");
    const requiredResources = [
        resourceDayAvailability(smallRoom, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(largeRoom, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(mikeInstructor, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
        resourceDayAvailability(meteInstructor, [availabilityBlock(dayAndTimePeriod(date, timePeriod(nineAm, fivePm)))]),
    ];
    const theService = service("Yoga", "Yoga", [specificResource(smallRoom), specificResource(mikeInstructor)], minutes(60), price(3500, currencies.GBP), [], [], capacity(10));
    const config = availabilityConfiguration(
        makeBusinessAvailability(makeBusinessHours(mondayToFriday, nineAm, fivePm), [], [date]),
        [],
        [],
        periodicStartTime(duration(minutes(60))),
    );

    test("there is no availability when we have no resources", () => {
        const available = expectSlots(availability.calculateAvailableSlots(config, [], serviceRequest(theService, date)));
        expect(available).toHaveLength(0);
    });

    test("there is availability when we have the resources", () => {
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [], serviceRequest(theService, date)));
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("09:00"), time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    });

    test("we have availability if we have only one booking", () => {
        const theBooking = booking(customerId(), theService, date, timePeriod(nineAm, time24("10:00")));
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

    test("we have no availability if the room is full", () => {
        const theBooking = booking(customerId(), theService, date, timePeriod(nineAm, time24("10:00")), capacity(10));
        const mutatedConfig: AvailabilityConfiguration = {
            ...config,
            resourceAvailability: requiredResources,
        };
        const available = expectSlots(availability.calculateAvailableSlots(mutatedConfig, [theBooking], serviceRequest(theService, date)));
        const times = available.map((a) => startTimeFns.toTime24(a.startTime));
        expect(times).toEqual([time24("10:00"), time24("11:00"), time24("12:00"), time24("13:00"), time24("14:00"), time24("15:00"), time24("16:00")]);
    });
})

