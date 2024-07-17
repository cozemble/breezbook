import {DayAndTimePeriod, dayAndTimePeriodFns, isoDateFns} from "@breezbook/packages-types";
import {configuration} from "./configuration/configuration.js";
import ResourceAvailability = configuration.ResourceAvailability;
import AvailabilityBlock = configuration.AvailabilityBlock;
import availabilityBlock = configuration.availabilityBlock;

function fitTime(block: AvailabilityBlock, fitTimes: DayAndTimePeriod[]): AvailabilityBlock[] {
    const fitTimesForDay = fitTimes.filter(bh => isoDateFns.isEqual(bh.day, block.when.day))
    if (fitTimesForDay.length === 0) {
        return [];
    }
    const periods = fitTimesForDay.map(bh => {
        if (dayAndTimePeriodFns.intersects(bh, block.when)) {
            return dayAndTimePeriodFns.intersection(bh, block.when);
        }
        return undefined;
    }).filter(bh => bh !== undefined) as DayAndTimePeriod[];
    return periods.map(p => availabilityBlock(p));
}

export function fitAvailability(resourceAvailability: ResourceAvailability[], fitTimes: DayAndTimePeriod[]): ResourceAvailability[] {
    return resourceAvailability.map(ra => {
        return {
            ...ra,
            availability: ra.availability.flatMap(datp => fitTime(datp, fitTimes))
        }
    })
}