import {businessAvailability, BusinessAvailability,} from "@breezbook/packages-core";
import {
    dayAndTimePeriod,
    DayAndTimePeriod,
    dayAndTimePeriodFns,
    isoDate,
    IsoDate,
    isoDateFns,
    time24,
    timePeriod
} from "@breezbook/packages-types";
import {DbBlockedTime, DbBusinessHours} from '../prisma/dbtypes.js';

function availabilityForDate(businessHours: DbBusinessHours[], date: IsoDate): DayAndTimePeriod[] {
    const dayOfWeek = isoDateFns.dayOfWeek(date);
    const relevantBusinessHours = businessHours.filter(bh => bh.day_of_week === dayOfWeek);
    return relevantBusinessHours.map(bh => dayAndTimePeriod(date, timePeriod(time24(bh.start_time_24hr), time24(bh.end_time_24hr))));
}

export function makeBusinessAvailability(businessHours: DbBusinessHours[], blockedTime: DbBlockedTime[], dates: IsoDate[]): BusinessAvailability {
    let availability = dates.flatMap(date => availabilityForDate(businessHours, date));
    availability = availability.flatMap(avail => {
        const applicableBlocks = blockedTime.filter(bt => dayAndTimePeriodFns.intersects(avail, dayAndTimePeriod(isoDate(bt.date), timePeriod(time24(bt.start_time_24hr), time24(bt.end_time_24hr)))));
        if (applicableBlocks.length === 0) {
            return [avail];
        }
        return applicableBlocks.flatMap(block => dayAndTimePeriodFns.splitPeriod(avail, dayAndTimePeriod(isoDate(block.date), timePeriod(time24(block.start_time_24hr), time24(block.end_time_24hr)))))
    })
    return businessAvailability(availability);
}