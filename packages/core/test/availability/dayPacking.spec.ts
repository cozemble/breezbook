import {expect, test} from 'vitest'
import {
    BookableTimes,
    businessConfiguration,
    businessHours,
    calculateAvailability,
    currencies,
    dayAndTimePeriod,
    duration,
    isoDate,
    minutes,
    periodicStartTime,
    price,
    resource,
    resourceDayAvailability,
    resourceType,
    service,
    time24,
    timePeriod, availabilityBlock, anySuitableResource
} from "../../src/index.js";
import {makeBusinessAvailability} from "../../src/makeBusinessAvailability.js";

const nineAm = time24('09:00');
const sixPm = time24('18:00');
const personalTrainer = resourceType('Personal Traniner');
const ptMike = resource(personalTrainer, "Mike");
const ptMete = resource(personalTrainer, "Mete");
const resources = [ptMete, ptMike];
const today = isoDate("2024-05-13");
const nineToSix = timePeriod(nineAm, sixPm)


export const gym = {
    times: {
        nineAm,
        sixPm,
    },
    resourceTypes: {
        personalTrainer
    },
    resources: {
        ptMike, ptMete
    },
    services: {
        personalTraining55Mins: service(
            'Personal Training 55 mins',
            'Personal Training 55 mins',
            [anySuitableResource(personalTrainer)],
            minutes(55),
            price(5500, currencies.GBP),
            [],
            [])
    }
}

test("no availability when no resources", () => {
    const theAvailability = makeBusinessAvailability([businessHours("Monday", nineAm, sixPm)], [], [today])
    const theBusiness = businessConfiguration(theAvailability,[], [], [gym.services.personalTraining55Mins], [], [], [], periodicStartTime(duration(minutes(15))), null)
    const response = calculateAvailability(theBusiness, [], gym.services.personalTraining55Mins.id, today, today)
    expect(response).toHaveLength(1)
    const dayAvailability = response[0] as BookableTimes
    expect(dayAvailability.bookableTimes).toHaveLength(0)
})

test("full availability when resources are available and no bookings", () => {
    const theAvailability = makeBusinessAvailability([businessHours("Monday", nineAm, sixPm)], [], [today]);
    const resourceAvailability = resources.map(r => resourceDayAvailability(r, [
        availabilityBlock(dayAndTimePeriod(today, nineToSix)),
    ]))

    const theBusiness = businessConfiguration(theAvailability, resources,resourceAvailability, [gym.services.personalTraining55Mins], [], [], [], periodicStartTime(duration(minutes(15))), null)
    const response = calculateAvailability(theBusiness, [], gym.services.personalTraining55Mins.id, today, today)
    expect(response).toHaveLength(1)
    const dayAvailability = response[0] as BookableTimes
    const times = dayAvailability.bookableTimes.map(b => b.time.value);
    expect(times).toEqual(["09:00",
        "09:15",
        "09:30",
        "09:45",
        "10:00",
        "10:15",
        "10:30",
        "10:45",
        "11:00",
        "11:15",
        "11:30",
        "11:45",
        "12:00",
        "12:15",
        "12:30",
        "12:45",
        "13:00",
        "13:15",
        "13:30",
        "13:45",
        "14:00",
        "14:15",
        "14:30",
        "14:45",
        "15:00",
        "15:15",
        "15:30",
        "15:45",
        "16:00",
        "16:15",
        "16:30",
        "16:45",
        "17:00",
    ])
})

test("periodic start controls the possible start times", () => {
    const theAvailability = makeBusinessAvailability([businessHours("Monday", nineAm, sixPm)], [], [today]);
    const resourceAvailability = resources.map(r => resourceDayAvailability(r, [
        availabilityBlock(dayAndTimePeriod(today, nineToSix)),
    ]))

    const theBusiness = businessConfiguration(theAvailability, resources,resourceAvailability, [gym.services.personalTraining55Mins], [], [], [], periodicStartTime(duration(minutes(30))), null)
    const response = calculateAvailability(theBusiness, [], gym.services.personalTraining55Mins.id, today, today)
    expect(response).toHaveLength(1)
    const dayAvailability = response[0] as BookableTimes
    const times = dayAvailability.bookableTimes.map(b => b.time.value);
    expect(times).toEqual(["09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "12:00",
        "12:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
    ])
})