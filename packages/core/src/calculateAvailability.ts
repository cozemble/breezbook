import {BookableSlot, } from './types.js';
import {Minutes, time24Fns, timePeriod, TimePeriod} from "@breezbook/packages-types";


export function calcSlotPeriod(slot: BookableSlot, serviceDuration: Minutes): TimePeriod {
    if (slot._type === 'exact.time.availability') {
        return timePeriod(slot.time, time24Fns.addMinutes(slot.time, serviceDuration));
    }
    return slot.slot;
}






