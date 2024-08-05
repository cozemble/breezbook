import {expect, test} from "vitest";
import {BlockedTime, businessAvailability, BusinessHours} from "../src/types.js";
import {makeBusinessAvailability} from "../src/makeBusinessAvailability.js";
import {dayAndTimePeriod, daysOfWeek, isoDate, isoDateFns, time24, timePeriod} from "@breezbook/packages-date-time";
import { makeId, tenantId } from '@breezbook/packages-types';


const allWeek: BusinessHours[] = daysOfWeek.map(day => {
    return {
        _type: "business.hours",
        id: makeId("1"),
        tenantId: tenantId("1"),
        day_of_week: day,
        start_time_24hr: time24("09:00"),
        end_time_24hr: time24("17:00")
    }
})

test("a few days with no blocked time", () => {
    const availability = makeBusinessAvailability(allWeek, [], isoDateFns.listDays(isoDate("2024-01-01"), isoDate("2024-01-04")))
    expect(availability).toEqual(businessAvailability([
        dayAndTimePeriod(isoDate("2024-01-01"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-02"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-03"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-04"), timePeriod(time24("09:00"), time24("17:00"))),
    ]))
});

test("finishing early one day", () => {
    const earlyFinishOnTheSecond: BlockedTime = {
        _type: "blocked.time",
        id: makeId("1"),
        tenantId: tenantId("1"),
        date: isoDate("2024-01-02"),
        start_time_24hr: time24("13:00"),
        end_time_24hr: time24("17:00")
    }
    const availability = makeBusinessAvailability(allWeek, [earlyFinishOnTheSecond], isoDateFns.listDays(isoDate("2024-01-01"), isoDate("2024-01-04")))
    expect(availability).toEqual(businessAvailability([
        dayAndTimePeriod(isoDate("2024-01-01"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-02"), timePeriod(time24("09:00"), time24("13:00"))),
        dayAndTimePeriod(isoDate("2024-01-03"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-04"), timePeriod(time24("09:00"), time24("17:00"))),
    ]))
})

test("gone for the middle of the day", () => {
    const goneForLunch: BlockedTime = {
        _type: "blocked.time",
        id: makeId("1"),
        tenantId: tenantId("1"),
        date: isoDate("2024-01-02"),
        start_time_24hr: time24("12:00"),
        end_time_24hr: time24("14:00")
    }
    const availability = makeBusinessAvailability(allWeek, [goneForLunch], isoDateFns.listDays(isoDate("2024-01-01"), isoDate("2024-01-04")))
    expect(availability).toEqual(businessAvailability([
        dayAndTimePeriod(isoDate("2024-01-01"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-02"), timePeriod(time24("09:00"), time24("12:00"))),
        dayAndTimePeriod(isoDate("2024-01-02"), timePeriod(time24("14:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-03"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-04"), timePeriod(time24("09:00"), time24("17:00"))),
    ]))
})

test("closed for a day", () => {
    const closedOnTheSecond: BlockedTime = {
        _type: "blocked.time",
        id: makeId("1"),
        tenantId: tenantId("1"),
        date: isoDate("2024-01-02"),
        start_time_24hr: time24("09:00"),
        end_time_24hr: time24("17:00")
    }
    const availability = makeBusinessAvailability(allWeek, [closedOnTheSecond], isoDateFns.listDays(isoDate("2024-01-01"), isoDate("2024-01-04")))
    expect(availability).toEqual(businessAvailability([
        dayAndTimePeriod(isoDate("2024-01-01"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-03"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-04"), timePeriod(time24("09:00"), time24("17:00"))),
    ]))
})