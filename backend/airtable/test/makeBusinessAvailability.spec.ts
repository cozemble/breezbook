import {expect, test} from "vitest";
import {businessAvailability, dayAndTimePeriod, isoDate, isoDateFns, time24, timePeriod} from "../src/types.js";
import {BlockedTime} from "../src/generated/dbtypes.js";

import {makeBusinessAvailability} from "../src/express/getEverythingForTenant.js";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const allWeek = daysOfWeek.map(day => {
    return {
        id: "1",
        tenant_id: "1",
        day_of_week: day,
        start_time_24hr: "09:00",
        end_time_24hr: "17:00"
    }
})

test("a few days with no blocked time",  () => {
    const availability = makeBusinessAvailability(allWeek, [], isoDateFns.listDays(isoDate("2024-01-01"), isoDate("2024-01-04")))
    expect(availability).toEqual(businessAvailability([
        dayAndTimePeriod(isoDate("2024-01-01"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-02"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-03"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-04"), timePeriod(time24("09:00"), time24("17:00"))),
    ]))
});

test("finishing early one day",  () => {
    const earlyFinishOnTheSecond: BlockedTime = {
        id: "1",
        tenant_id: "1",
        date: "2024-01-02",
        start_time_24hr: "13:00",
        end_time_24hr: "17:00"
    }
    const availability = makeBusinessAvailability(allWeek, [earlyFinishOnTheSecond], isoDateFns.listDays(isoDate("2024-01-01"), isoDate("2024-01-04")))
    expect(availability).toEqual(businessAvailability([
        dayAndTimePeriod(isoDate("2024-01-01"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-02"), timePeriod(time24("09:00"), time24("13:00"))),
        dayAndTimePeriod(isoDate("2024-01-03"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-04"), timePeriod(time24("09:00"), time24("17:00"))),
    ]))
})

test("gone for the middle of the day",  () => {
    const goneForLunch: BlockedTime = {
        id: "1",
        tenant_id: "1",
        date: "2024-01-02",
        start_time_24hr: "12:00",
        end_time_24hr: "14:00"
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
        id: "1",
        tenant_id: "1",
        date: "2024-01-02",
        start_time_24hr: "09:00",
        end_time_24hr: "17:00"
    }
    const availability = makeBusinessAvailability(allWeek, [closedOnTheSecond], isoDateFns.listDays(isoDate("2024-01-01"), isoDate("2024-01-04")))
    expect(availability).toEqual(businessAvailability([
        dayAndTimePeriod(isoDate("2024-01-01"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-03"), timePeriod(time24("09:00"), time24("17:00"))),
        dayAndTimePeriod(isoDate("2024-01-04"), timePeriod(time24("09:00"), time24("17:00"))),
    ]))
})