import {describe, expect, test} from "vitest";
import {dayAndTimePeriod, exactTimeAvailability, isoDate, minutes, time24, timePeriod} from "@breezbook/packages-types";
import {startTimeFns} from "../src/index.js";

describe("fitAvailability", () => {
    test("drops time if it extends beyond end of availability", () => {
        const start = time24("15:30")
        const end = time24("16:00")
        const duration = minutes(60)

        const result = startTimeFns.fitAvailability([exactTimeAvailability(start)], duration, [dayAndTimePeriod(isoDate(), timePeriod(start, end))])

        expect(result).toHaveLength(0);
    });
});