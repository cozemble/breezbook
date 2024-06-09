import {test, expect} from "vitest";
import {time24, timePeriod, timePeriodFns} from "../src/types.js";

const nineToTen = timePeriod(time24('09:00'), time24('10:00'));
const tenToEleven = timePeriod(time24('10:00'), time24('11:00'));
const eightFiftyToTenOhFive = timePeriod(time24('08:50'), time24('10:05'));
const nineFifteenToNineThirty = timePeriod(time24('09:15'), time24('09:30'));

test("overlapping time periods", () => {
    expect(timePeriodFns.overlaps(nineToTen,tenToEleven)).toBe(false);
    expect(timePeriodFns.overlaps(tenToEleven,nineToTen)).toBe(false);
    expect(timePeriodFns.overlaps(eightFiftyToTenOhFive,nineToTen)).toBe(true);
    expect(timePeriodFns.overlaps(nineToTen,eightFiftyToTenOhFive)).toBe(false);

    expect(timePeriodFns.overlaps(nineToTen,nineFifteenToNineThirty)).toBe(true);
    expect(timePeriodFns.overlaps(nineToTen,nineToTen)).toBe(true);
})

test("intersecting time periods", () => {
    expect(timePeriodFns.intersects(nineToTen,tenToEleven)).toBe(false);
    expect(timePeriodFns.intersects(tenToEleven,nineToTen)).toBe(false);
    expect(timePeriodFns.intersects(eightFiftyToTenOhFive,nineToTen)).toBe(true);
    expect(timePeriodFns.intersects(nineToTen,eightFiftyToTenOhFive)).toBe(true);

    expect(timePeriodFns.intersects(nineToTen,nineFifteenToNineThirty)).toBe(true);
    expect(timePeriodFns.intersects(nineToTen,nineToTen)).toBe(true);
});

test("sequential time periods", () => {
    expect(timePeriodFns.sequential(nineToTen,tenToEleven)).toBe(true);
    expect(timePeriodFns.sequential(tenToEleven,nineToTen)).toBe(false);
});