import {describe, expect, test} from 'vitest'
import {dayAndTimePeriod, dayAndTimePeriodFns, isoDate, time24, timePeriod} from "../src/index.js";

const aprilFirstNineToFive = dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:00"), time24("17:00")))
const aprilSecondNineToFive = dayAndTimePeriod(isoDate("2021-04-02"), timePeriod(time24("09:00"), time24("17:00")))
const aprilFirstTenToEleven = dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("10:00"), time24("11:00")))

describe("dayAndTimePeriodFns.splitPeriod", () => {
    test("does nothing when the time periods have no intersection", () => {
        const result = dayAndTimePeriodFns.splitPeriod(aprilFirstNineToFive, aprilSecondNineToFive)
        expect(result).toEqual([aprilFirstNineToFive])
    })

    test("splits the period when there is an intersection", () => {
        const result = dayAndTimePeriodFns.splitPeriod(aprilFirstNineToFive, aprilFirstTenToEleven)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:00"), time24("10:00"))))
        expect(result[1]).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("11:00"), time24("17:00"))))
    })

    test("includes the given period when instructed to", () => {
        const result = dayAndTimePeriodFns.splitPeriod(aprilFirstNineToFive, aprilFirstTenToEleven, true)
        expect(result).toHaveLength(3)
        expect(result[0]).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:00"), time24("10:00"))))
        expect(result[1]).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("10:00"), time24("11:00"))))
        expect(result[2]).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("11:00"), time24("17:00"))))
    })

    test("when the period ends before the given period", () => {
        const result = dayAndTimePeriodFns.splitPeriod(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:30"), time24("10:30"))), aprilFirstTenToEleven, true)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("09:30"), time24("10:00"))))
        expect(result[1]).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("10:00"), time24("11:00"))))
    })

    test("when the period starts after the given period", () => {
        const result = dayAndTimePeriodFns.splitPeriod(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("10:30"), time24("11:30"))), aprilFirstTenToEleven, true)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("10:00"), time24("11:00"))))
        expect(result[1]).toEqual(dayAndTimePeriod(isoDate("2021-04-01"), timePeriod(time24("11:00"), time24("11:30"))))
    })
});
