import {describe, expect, test} from 'vitest'
import { dayAndTimePeriod, dayAndTimePeriodFns, isoDate, time24, timePeriod, timezones } from '../src/index.js';

const aprilFirstNineToFive = dayAndTimePeriodFns.fromStrings("2021-04-01", "09:00","17:00")
const aprilSecondNineToFive = dayAndTimePeriodFns.fromStrings("2021-04-02", "09:00","17:00")
const aprilFirstTenToEleven = dayAndTimePeriodFns.fromStrings("2021-04-01", "10:00","11:00")

describe("dayAndTimePeriodFns.splitPeriod", () => {
    test("does nothing when the time periods have no intersection", () => {
        const result = dayAndTimePeriodFns.splitPeriod(aprilFirstNineToFive, aprilSecondNineToFive)
        expect(result).toEqual([aprilFirstNineToFive])
    })

    test("splits the period when there is an intersection", () => {
        const result = dayAndTimePeriodFns.splitPeriod(aprilFirstNineToFive, aprilFirstTenToEleven)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual(dayAndTimePeriodFns.fromStrings("2021-04-01", "09:00","10:00"))
        expect(result[1]).toEqual(dayAndTimePeriodFns.fromStrings("2021-04-01", "11:00","17:00"))
    })

    test("includes the given period when instructed to", () => {
        const result = dayAndTimePeriodFns.splitPeriod(aprilFirstNineToFive, aprilFirstTenToEleven, true)
        expect(result).toHaveLength(3)
        expect(result[0]).toEqual(dayAndTimePeriodFns.fromStrings("2021-04-01", "09:00","10:00"))
        expect(result[1]).toEqual(dayAndTimePeriodFns.fromStrings("2021-04-01", "10:00","11:00"))
        expect(result[2]).toEqual(dayAndTimePeriodFns.fromStrings("2021-04-01", "11:00","17:00"))
    })

    test("when the period ends before the given period", () => {
        const result = dayAndTimePeriodFns.splitPeriod(dayAndTimePeriodFns.fromStrings("2021-04-01", "09:30","10:30"), aprilFirstTenToEleven, true)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual(dayAndTimePeriodFns.fromStrings("2021-04-01", "09:30","10:00"))
        expect(result[1]).toEqual(dayAndTimePeriodFns.fromStrings("2021-04-01", "10:00","11:00"))
    })

    test("when the period starts after the given period", () => {
        const result = dayAndTimePeriodFns.splitPeriod(dayAndTimePeriodFns.fromStrings("2021-04-01", "10:30","11:30"), aprilFirstTenToEleven, true)
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual(dayAndTimePeriodFns.fromStrings("2021-04-01", "10:00","11:00"))
        expect(result[1]).toEqual(dayAndTimePeriodFns.fromStrings("2021-04-01", "11:00","11:30"))
    })
});
