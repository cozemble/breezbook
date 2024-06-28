import {describe, expect, test} from 'vitest'
import {capacity, duration, minutes} from "@breezbook/packages-core";
import {availability} from "../src/availability.js";
import available = availability.available;
import timeslotFns = availability.timeslotFns;

describe("given a service that requires no resources", () => {
    const theService = availability.service([])

    test("we can do any time slot", () => {
        const request = availability.serviceRequest(theService, duration(minutes(30)))
        const slot1 = timeslotFns.sameDay("2021-01-01", "09:00", "09:30");
        const slot2 = timeslotFns.sameDay("2021-01-01", "09:30", "10:00");
        const result = availability.checkAvailability(request, [], [], [slot1, slot2])
        expect(result).toEqual([
            available(slot1, [], capacity(1), capacity(1)),
            available(slot2, [], capacity(1), capacity(1))
        ])
    })
})
