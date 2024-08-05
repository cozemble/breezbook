import { BlockedTime, businessAvailability, BusinessAvailability, businessHours, BusinessHours } from './types.js';
import {
	dayAndTimePeriod,
	DayAndTimePeriod,
	dayAndTimePeriodFns,
	DayOfWeek,
	IsoDate,
	isoDateFns, timePeriod,
	TwentyFourHourClockTime
} from '@breezbook/packages-date-time';

function availabilityForDate(businessHours: BusinessHours[], date: IsoDate): DayAndTimePeriod[] {
	const dayOfWeek = isoDateFns.dayOfWeek(date);
	const relevantBusinessHours = businessHours.filter(bh => bh.day_of_week === dayOfWeek);
	return relevantBusinessHours.map(bh => dayAndTimePeriod(date, timePeriod(bh.start_time_24hr, bh.end_time_24hr)));
}

export function makeBusinessAvailability(businessHours: BusinessHours[], blockedTime: BlockedTime[], dates: IsoDate[]): BusinessAvailability {
	let availability = dates.flatMap(date => availabilityForDate(businessHours, date));
	availability = availability.flatMap(avail => {
		const applicableBlocks = blockedTime.filter(bt => dayAndTimePeriodFns.intersects(avail, dayAndTimePeriod(bt.date, timePeriod(bt.start_time_24hr, bt.end_time_24hr))));
		if (applicableBlocks.length === 0) {
			return [avail];
		}
		return applicableBlocks.flatMap(block => dayAndTimePeriodFns.splitPeriod(avail, dayAndTimePeriod(block.date, timePeriod(block.start_time_24hr, block.end_time_24hr))));
	});
	return businessAvailability(availability);
}

export function makeBusinessHours(daysOfWeek: DayOfWeek[], startTime: TwentyFourHourClockTime, endTime: TwentyFourHourClockTime): BusinessHours[] {
	return daysOfWeek.map(daysOfWeek => businessHours(daysOfWeek, startTime, endTime));
}
