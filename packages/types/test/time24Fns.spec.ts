import {test, expect} from 'vitest';
import {minutes, time24, time24Fns} from "../src/index.js";

test("can convert times into words", () => {
    expect(time24Fns.toWords(time24("00:00"))).toBe("midnight");
    expect(time24Fns.toWords(time24("00:05"))).toBe("12 zero 5 am");
    expect(time24Fns.toWords(time24("00:15"))).toBe("12 15 am");
    expect(time24Fns.toWords(time24("00:39"))).toBe("12 39 am");
    expect(time24Fns.toWords(time24("01:39"))).toBe("1 39 am");
    expect(time24Fns.toWords(time24("11:59"))).toBe("11 59 am");
    expect(time24Fns.toWords(time24("12:00"))).toBe("midday");
    expect(time24Fns.toWords(time24("12:01"))).toBe("12 zero 1 pm");
    expect(time24Fns.toWords(time24("12:15"))).toBe("12 15 pm");
});

test("can add minutes to a time", () => {
    expect(time24Fns.addMinutes(time24("00:00"), minutes(0))).toEqual(time24("00:00"));
    expect(time24Fns.addMinutes(time24("00:00"), minutes(5))).toEqual(time24("00:05"));
    expect(time24Fns.addMinutes(time24("00:00"), minutes(15))).toEqual(time24("00:15"));
    expect(time24Fns.addMinutes(time24("16:00"), minutes(15))).toEqual(time24("16:15"));
});