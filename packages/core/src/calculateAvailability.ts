import {Minutes, time24Fns, timePeriod, TimePeriod} from "@breezbook/packages-types";
import {StartTime} from "./availability.js";


export function calcSlotPeriod(slot: StartTime, serviceDuration: Minutes): TimePeriod {
    if (slot._type === 'exact.time.availability') {
        return timePeriod(slot.time, time24Fns.addMinutes(slot.time, serviceDuration));
    }
    return slot.slot;
}






