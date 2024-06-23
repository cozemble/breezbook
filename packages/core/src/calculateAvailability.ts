import {BookableSlot, Minutes, time24Fns, timePeriod, TimePeriod} from './types.js';


export function calcSlotPeriod(slot: BookableSlot, serviceDuration: Minutes): TimePeriod {
    if (slot._type === 'exact.time.availability') {
        return timePeriod(slot.time, time24Fns.addMinutes(slot.time, serviceDuration));
    }
    return slot.slot;
}






