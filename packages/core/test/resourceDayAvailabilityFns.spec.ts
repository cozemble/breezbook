import {describe, expect, test} from 'vitest'
import {
    availabilityBlock,
    capacity,
    dayAndTimePeriod,
    fungibleResource,
    isoDate,
    resourceDayAvailability,
    resourceDayAvailabilityFns,
    resourceType,
    time24,
    timePeriod
} from "../src/index.js";

const aResourceType = resourceType("test resource type", true)
const aResource = fungibleResource(aResourceType, "test resource")
const aprilFirstNineToFive = dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:00"), time24("17:00")))
const aprilSecondNineToFive = dayAndTimePeriod(isoDate("2021-04-02"), timePeriod(time24("09:00"), time24("17:00")))
const availabilityOnAprilFirst = resourceDayAvailability(aResource, [availabilityBlock(aprilFirstNineToFive, capacity(2))])
const aprilFirstTenToEleven = dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("10:00"), time24("11:00")))

describe("resourceDayAvailabilityFns.subtractCapacity", () => {
    test("does nothing when there is no day and time period overlap", () => {
        const result = resourceDayAvailabilityFns.subtractCapacity(availabilityOnAprilFirst, aprilSecondNineToFive, capacity(2))
        expect(result).toEqual(availabilityOnAprilFirst)
    });

    test("subtracts capacity when dates overlap", () => {
        const result = resourceDayAvailabilityFns.subtractCapacity(availabilityOnAprilFirst, aprilFirstTenToEleven, capacity(1))
        expect(result.availability).toHaveLength(3)

        expect(result.availability[0].capacity.value).toEqual(2)
        expect(result.availability[0].when).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:00"), time24("10:00"))))

        expect(result.availability[1].capacity.value).toEqual(1)
        expect(result.availability[1].when).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("10:00"), time24("11:00"))))

        expect(result.availability[2].capacity.value).toEqual(2)
        expect(result.availability[2].when).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("11:00"), time24("17:00"))))
    });

    test("the availability block disappears if capacity is zero", () => {
        const result = resourceDayAvailabilityFns.subtractCapacity(availabilityOnAprilFirst, aprilFirstTenToEleven, capacity(2))
        expect(result.availability).toHaveLength(2)

        expect(result.availability[0].capacity.value).toEqual(2)
        expect(result.availability[0].when).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:00"), time24("10:00"))))

        expect(result.availability[1].capacity.value).toEqual(2)
        expect(result.availability[1].when).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("11:00"), time24("17:00"))))
    });

    test("when the period crosses two availability blocks", () => {
        const threePartAvailabiltyOnAprilFirst = resourceDayAvailability(aResource, [
            availabilityBlock(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:00"), time24("09:30"))), capacity(2)),
            availabilityBlock(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:30"), time24("10:30"))), capacity(2)),
            availabilityBlock(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("10:30"), time24("11:30"))), capacity(2)),
            availabilityBlock(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("11:30"), time24("17:00"))), capacity(2))
        ])
        const result = resourceDayAvailabilityFns.subtractCapacity(threePartAvailabiltyOnAprilFirst, aprilFirstTenToEleven, capacity(1))
        expect(result.availability).toHaveLength(5)

        const [first, second, third, fourth, fifth] = result.availability
        expect(first.when).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:00"), time24("09:30"))))
        expect(first.capacity.value).toEqual(2)
        expect(second.when).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:30"), time24("10:00"))))
        expect(second.capacity.value).toEqual(2)
        expect(third.when).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("10:00"), time24("11:00"))))
        expect(third.capacity.value).toEqual(1)
        expect(fourth.when).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("11:00"), time24("11:30"))))
        expect(fourth.capacity.value).toEqual(2)
        expect(fifth.when).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("11:30"), time24("17:00"))))
        expect(fifth.capacity.value).toEqual(2)
    })
});