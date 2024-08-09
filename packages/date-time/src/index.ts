import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import dayJsTimezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(dayJsTimezone);

export function mandatory<T>(value: T | undefined | null, errorMessage: string): T {
	if (value === null || value === undefined) {
		throw new Error(errorMessage);
	}
	return value as T;
}

export interface Timezone {
	_type: 'timezone';
	value: string;
}

export function timezone(value: string): Timezone {
	return { _type: 'timezone', value };
}

export const timezones = {
	utc: timezone('UTC'),
	london: timezone('Europe/London')
};

export interface IsoDate {
	_type: 'iso.date';
	value: string;
}

export function isoDate(value: string): IsoDate {
	if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
		throw new Error(`Invalid date format ${value}. Expected YYYY-MM-DD`);
	}
	return { _type: 'iso.date', value };
}

export interface TwentyFourHourClockTime {
	_type: 'twenty.four.hour.clock.time';
	value: string;
}

export function time24(value: string): TwentyFourHourClockTime {
	if (!value.match(/^\d{2}:\d{2}$/)) {
		throw new Error(`Invalid time format '${value}' - expected HH:MM`);
	}
	return { _type: 'twenty.four.hour.clock.time', value };
}

export interface ValueType<T> {
	_type: unknown;
	value: T;
}

export interface Months extends ValueType<number> {
	_type: 'months';
}

export function months(value: number): Months {
	return { value, _type: 'months' };
}

export interface Years extends ValueType<number> {
	_type: 'years';
}

export function years(value: number): Years {
	return { value, _type: 'years' };
}

export interface Weeks extends ValueType<number> {
	_type: 'weeks';
}

export function weeks(value: number): Weeks {
	return { value, _type: 'weeks' };
}

export interface Days extends ValueType<number> {
	_type: 'days';
}

export function days(value: number): Days {
	return { value, _type: 'days' };
}

export interface Hours extends ValueType<number> {
	_type: 'hours';
}

export function hours(value: number): Hours {
	return { value, _type: 'hours' };
}

export interface Minutes extends ValueType<number> {
	_type: 'minutes';
}

export function minutes(value: number): Minutes {
	return {
		_type: 'minutes',
		value
	};
}

export const minuteFns = {
	sum(acc: Minutes, d: Minutes) {
		return minutes(acc.value + d.value);
	},
	toHours(minutes: Minutes): number {
		return minutes.value / 60;
	}
};

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const mondayToFriday: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export interface DayOfWeekAndTimePeriod {
	_type: 'day.of.week.and.time.period';
	day: DayOfWeek;
	period: TimePeriod;
}

export function dayOfWeekAndTimePeriod(day: DayOfWeek, period: TimePeriod): DayOfWeekAndTimePeriod {
	return { _type: 'day.of.week.and.time.period', day, period };
}

export type DurationUnit = Minutes | Days | Hours | Weeks

export interface Duration extends ValueType<DurationUnit> {
	_type: 'duration';
}

export function duration(value: DurationUnit): Duration {
	return {
		_type: 'duration',
		value
	};
}

export const durationFns = {
	toMinutes: (duration: Duration): Minutes => {
		switch (duration.value._type) {
			case 'minutes':
				return duration.value;
			case 'hours':
				return minutes(duration.value.value * 60);
			case 'days':
				return minutes(duration.value.value * 60 * 24);
			case 'weeks':
				return minutes(duration.value.value * 60 * 24 * 7);
		}
	},
	matchUnits(d: Duration, exemplar: Duration): Duration {
		if (exemplar.value._type === d.value._type) {
			return d;
		}
		const asMinutes = durationFns.toMinutes(d);
		if (exemplar.value._type === 'minutes') {
			return duration(asMinutes);
		}
		if (exemplar.value._type === 'hours') {
			return duration(hours(asMinutes.value / 60));
		}
		if (exemplar.value._type === 'days') {
			return duration(days(asMinutes.value / 60 / 24));
		}
		if (exemplar.value._type === 'weeks') {
			return duration(weeks(asMinutes.value / 60 / 24 / 7));
		}
		throw new Error(`Unknown duration unit ${JSON.stringify(exemplar.value)}`);
	},
	toDuration(d: Duration | Minutes): Duration {
		return d._type === 'duration' ? d : duration(d);
	}
};

export const time24Fns = {
	addMinutes: (time: TwentyFourHourClockTime, addition: Minutes): TwentyFourHourClockTime => {
		const additionalMinutes = addition.value;
		if (isNaN(additionalMinutes)) {
			throw new Error(`Invalid minutes value ${additionalMinutes}, type = ${typeof additionalMinutes}`);
		}
		const [hours, mins] = time.value.split(':').map((s) => parseInt(s, 10));
		if (hours === undefined || mins === undefined || isNaN(hours) || isNaN(mins)) {
			throw new Error(`Invalid time format '${time.value}' - expected HH:MM (hours = ${hours}, minutes = ${mins})`);
		}
		const newMins = mins + additionalMinutes;
		const newHours = hours + Math.floor(newMins / 60);
		const newMinsMod60 = newMins % 60;

		const paddedHours = newHours.toString().padStart(2, '0');
		const paddedMins = (newMinsMod60 < 10 ? '0' : '') + newMinsMod60;

		return time24(`${paddedHours}:${paddedMins}`);
	},
	toWords(time: TwentyFourHourClockTime): string {
		const [hours, minutes] = time.value.split(':').map((s) => parseInt(s, 10));
		if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes)) {
			throw new Error(`Invalid time format '${time.value}' - expected HH:MM (hours = ${hours}, minutes = ${minutes})`);
		}
		const amPm = hours < 12 ? 'am' : 'pm';
		const adjustedHours = amPm === 'pm' ? hours - 12 : hours;
		const adjustedMinutes = minutes < 10 ? `zero ${minutes}` : minutes;
		if (minutes === 0) {
			if (adjustedHours === 0 && amPm === 'am') {
				return `midnight`;
			}
			if (adjustedHours === 0 && amPm === 'pm') {
				return `midday`;
			}
			return `${adjustedHours} ${amPm}`;
		}
		if (adjustedHours === 0) {
			return `12 ${adjustedMinutes} ${amPm}`;
		}
		return `${adjustedHours} ${adjustedMinutes} ${amPm}`;
	},
	equals(a: TwentyFourHourClockTime, b: TwentyFourHourClockTime) {
		return a.value === b.value;
	},
	duration(startTime: TwentyFourHourClockTime, endTime: TwentyFourHourClockTime): Duration {
		const startAsDate = new Date(`2021-01-01T${startTime.value}`);
		const endAsDate = new Date(`2021-01-01T${endTime.value}`);
		const diff = endAsDate.getTime() - startAsDate.getTime();
		const diffInMinutes = diff / 1000 / 60;
		return duration(minutes(diffInMinutes));
	},
	max(from: TwentyFourHourClockTime, from2: TwentyFourHourClockTime) {
		return from.value > from2.value ? from : from2;
	},
	min(to: TwentyFourHourClockTime, to2: TwentyFourHourClockTime) {
		return to.value < to2.value ? to : to2;
	},
	lt(start: TwentyFourHourClockTime, end: TwentyFourHourClockTime) {
		return start.value < end.value;
	},
	range(startTime: TwentyFourHourClockTime, endTime: TwentyFourHourClockTime, period: Minutes): TwentyFourHourClockTime[] {
		const result = [];
		let currentTime = startTime;
		while (this.lt(currentTime, endTime)) {
			result.push(currentTime);
			currentTime = this.addMinutes(currentTime, period);
		}
		return result;
	},
	getHour(t: TwentyFourHourClockTime): number {
		return parseInt(t.value.split(':')[0]);
	},
	getMinutes(t: TwentyFourHourClockTime): number {
		return parseInt(t.value.split(':')[1]);
	},
	addDays(start: IsoDate, days: Days | number): IsoDate {
		const numberOfDays = typeof days === 'number' ? days : days.value;
		const startDate = dayjs.utc(start.value);
		const endDate = startDate.add(numberOfDays, 'day');
		return isoDate(endDate.format('YYYY-MM-DD'));
	},
	addDuration(time: TwentyFourHourClockTime, duration: Duration): TwentyFourHourClockTime {
		return time24Fns.addMinutes(time, durationFns.toMinutes(duration));
	}
};


export interface DateAndTime {
	_type: 'date.and.time';
	date: IsoDate;
	time: TwentyFourHourClockTime;
}

export function dateAndTime(date: IsoDate, time: TwentyFourHourClockTime): DateAndTime {
	return { _type: 'date.and.time', date, time };
}

export const dateAndTimeFns = {
	now(timezone: Timezone): DateAndTime {
		const nowInTz = dayjs().tz(timezone.value);
		return dateAndTime(
			isoDate(nowInTz.format('YYYY-MM-DD')),
			time24(nowInTz.format('HH:mm'))
		);
	}
};

export const isoDateFns = {
	isEqual(date1: IsoDate, date2: IsoDate): boolean {
		return date1.value === date2.value;
	},
	today(timezone: Timezone): IsoDate {
		const nowInTz = dayjs().tz(timezone.value);
		return isoDate(nowInTz.format('YYYY-MM-DD'));
	},
	sameDay(date1: IsoDate, date2: IsoDate) {
		return this.isEqual(date1, date2);
	},
	listDays(fromDate: IsoDate, toDate: IsoDate): IsoDate[] {
		let currentDate = fromDate;
		const dates: IsoDate[] = [];
		while (this.lte(currentDate, toDate)) {
			dates.push(currentDate);
			currentDate = this.addDays(currentDate, 1);
		}
		return dates;
	},
	addDays(date: IsoDate, days: number): IsoDate {
		return isoDate(dayjs.utc(date.value).add(days, 'day').format('YYYY-MM-DD'));
	},
	dayOfWeek(date: IsoDate): DayOfWeek {
		return new Date(date.value).toLocaleDateString('en-GB', { weekday: 'long' }) as DayOfWeek;
	},
	indexOfDayOfWeek(date: IsoDate) {
		return daysOfWeek.indexOf(this.dayOfWeek(date));
	},
	gte(date1: IsoDate, date2: IsoDate) {
		return date1.value >= date2.value;
	},
	lte(date1: IsoDate, date2: IsoDate) {
		return date1.value <= date2.value;
	},
	gt(date1: IsoDate, date2: IsoDate) {
		return date1.value > date2.value;
	},
	lt(date1: IsoDate, date2: IsoDate) {
		return date1.value < date2.value;
	},
	max(...dates: IsoDate[]) {
		if (dates.length === 0) {
			throw new Error('No dates to compare');
		}
		return dates.reduce((max, date) => (this.gte(date, max) ? date : max), mandatory(dates[0], `No dates to compare`));
	},
	min(...dates: IsoDate[]) {
		if (dates.length === 0) {
			throw new Error('No dates to compare');
		}
		return dates.reduce((min, date) => (this.lte(date, min) ? date : min), mandatory(dates[0], `No dates to compare`));
	},
	toJavascriptDate(date: IsoDate, time: TwentyFourHourClockTime) {
		const [year, month, day] = date.value.split('-').map((s) => parseInt(s, 10));
		if (!year || !month || !day) {
			throw new Error(`Invalid date format ${date.value}. Expected YYYY-MM-DD`);
		}
		const [hours, minutes] = time.value.split(':').map((s) => parseInt(s, 10));
		return new Date(year, month - 1, day, hours, minutes);
	},
	getDateRange(dates: IsoDate[]): { fromDate: IsoDate; toDate: IsoDate } {
		return {
			fromDate: this.min(...dates),
			toDate: this.max(...dates)
		};
	},
	next(timezone: Timezone, dayOfWeek: DayOfWeek): IsoDate {
		const twoWeeks = [...daysOfWeek, ...daysOfWeek];
		const todayIndex = twoWeeks.indexOf(this.dayOfWeek(isoDateFns.today(timezone)));
		const dayIndex = twoWeeks.indexOf(dayOfWeek, todayIndex);
		const daysToAdd = dayIndex - todayIndex;
		return this.addDays(isoDateFns.today(timezone), daysToAdd);
	},
	daysUntil(other: IsoDate): number {
		const today = isoDateFns.today(timezones.utc);
		return dayjs.utc(other.value).diff(today.value, 'days');
	},
	isWeekend(date: IsoDate) {
		const dayOfWeek = this.dayOfWeek(date);
		return dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
	},
	daysInMonth(startOfMonth: IsoDate): IsoDate[] {
		const start = dayjs.utc(startOfMonth.value).startOf('month');
		const end = dayjs.utc(startOfMonth.value).endOf('month');
		return this.listDays(isoDate(start.format('YYYY-MM-DD')), isoDate(end.format('YYYY-MM-DD')));
	},
	daysBetween(a: IsoDate, b: IsoDate): number {
		return dayjs.utc(b.value).diff(a.value, 'days');
	},
	addMonths(d: IsoDate, months: number): IsoDate {
		return isoDate(dayjs.utc(d.value).add(months, 'month').format('YYYY-MM-DD'));
	},
	startOfMonth(d: IsoDate): IsoDate {
		return isoDate(dayjs.utc(d.value).startOf('month').format('YYYY-MM-DD'));
	}
};

export interface TimePeriod {
	_type: 'time.period';
	from: TwentyFourHourClockTime;
	to: TwentyFourHourClockTime;
}

export interface DayAndTimePeriod {
	_type: 'day.and.time.period';
	day: IsoDate;
	period: TimePeriod;
}

export function dayAndTimePeriod(day: IsoDate, period: TimePeriod): DayAndTimePeriod {
	return {
		_type: 'day.and.time.period',
		day,
		period
	};
}

export const dayAndTimePeriodFns = {
	fromStrings: (date: string, from: string, to: string): DayAndTimePeriod => {
		return dayAndTimePeriod(isoDate(date), timePeriod(time24(from), time24(to)));
	},
	overlaps: (dayAndTimePeriod1: DayAndTimePeriod, dayAndTimePeriod2: DayAndTimePeriod): boolean => {
		return isoDateFns.isEqual(dayAndTimePeriod1.day, dayAndTimePeriod2.day) && timePeriodFns.overlaps(dayAndTimePeriod1.period, dayAndTimePeriod2.period);
	},
	splitPeriod(da: DayAndTimePeriod, bookingPeriod: DayAndTimePeriod, includeGivenPeriod = false): DayAndTimePeriod[] {
		if (!dayAndTimePeriodFns.intersects(da, bookingPeriod)) {
			return [da];
		}
		const remainingTimePeriods = [] as TimePeriod[];
		if (timePeriodFns.startsEarlier(da.period, bookingPeriod.period)) {
			remainingTimePeriods.push(timePeriod(da.period.from, bookingPeriod.period.from));
		}
		if (includeGivenPeriod) {
			remainingTimePeriods.push(bookingPeriod.period);
		}
		if (timePeriodFns.endsLater(da.period, bookingPeriod.period)) {
			remainingTimePeriods.push(timePeriod(bookingPeriod.period.to, da.period.to));
		}
		return remainingTimePeriods.map((tp) => dayAndTimePeriod(da.day, timePeriod(tp.from, tp.to)));
	},
	intersection(period1: DayAndTimePeriod, period2: DayAndTimePeriod) {
		return dayAndTimePeriod(
			period1.day,
			timePeriod(timePeriodFns.startsEarlier(period1.period, period2.period) ? period2.period.from : period1.period.from,
				timePeriodFns.endsLater(period1.period, period2.period) ? period2.period.to : period1.period.to));
	},
	intersects(period1: DayAndTimePeriod, period2: DayAndTimePeriod) {
		return isoDateFns.sameDay(period1.day, period2.day) && timePeriodFns.intersects(period1.period, period2.period);
	},
	equals(when: DayAndTimePeriod, when2: DayAndTimePeriod) {
		return isoDateFns.isEqual(when.day, when2.day) && timePeriodFns.equals(when.period, when2.period);
	}
};

export function timePeriod(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime): TimePeriod {
	return {
		_type: 'time.period',
		from,
		to
	};
}

export const timePeriodFns = {
	allDay: timePeriod(time24('00:00'), time24('23:59')),
	overlaps: (period1: TimePeriod, period2: TimePeriod): boolean => {
		return period1.from.value <= period2.from.value && period1.to.value >= period2.to.value;
	},
	startsEarlier(period: TimePeriod, period2: TimePeriod) {
		return period.from.value < period2.from.value;
	},
	endsLater(period: TimePeriod, period2: TimePeriod) {
		return period.to.value > period2.to.value;
	},
	intersects(period: TimePeriod, period2: TimePeriod) {
		if (timePeriodFns.sequential(period, period2) || timePeriodFns.sequential(period2, period)) {
			return false;
		}
		return (
			(period2.from.value >= period.from.value && period2.from.value <= period.to.value) ||
			(period2.to.value >= period.from.value && period2.to.value <= period.to.value) ||
			(period2.from.value <= period.from.value && period2.to.value >= period.to.value)
		);
	},
	listPossibleStartTimes(period: TimePeriod, duration: Minutes): TwentyFourHourClockTime[] {
		let currentTime = period.from;
		const result: TwentyFourHourClockTime[] = [];
		while (currentTime.value < period.to.value) {
			result.push(currentTime);
			currentTime = time24Fns.addMinutes(currentTime, duration);
		}
		return result;
	},
	equals(period: TimePeriod, period2: TimePeriod) {
		return period.from.value === period2.from.value && period.to.value === period2.to.value;
	},
	sequential(period: TimePeriod, period2: TimePeriod) {
		return period.to.value === period2.from.value;
	},
	calcPeriod(from: TwentyFourHourClockTime, duration: Duration | Minutes): TimePeriod {
		const durationMinutes = duration._type === 'duration' ? durationFns.toMinutes(duration) : duration;
		return timePeriod(from, time24Fns.addMinutes(from, durationMinutes));
	},
	overlap(a: TimePeriod, b: TimePeriod): TimePeriod | null {
		const start = time24Fns.max(a.from, b.from);
		const end = time24Fns.min(a.to, b.to);
		if (time24Fns.lt(start, end)) {
			return timePeriod(start, end);
		}
		return null;
	},
	duration(t: TimePeriod): Duration {
		const start = dayjs.utc(`2021-01-01T${t.from.value}`);
		const end = dayjs.utc(`2021-01-01T${t.to.value}`);
		const diff = end.diff(start, 'minutes');
		return duration(minutes(diff));
	}
};


export interface DayAndTime {
	_type: 'day.and.time';
	day: IsoDate;
	time: TwentyFourHourClockTime;
}

export function dayAndTime(day: IsoDate, time: TwentyFourHourClockTime): DayAndTime {
	return {
		_type: 'day.and.time',
		day,
		time
	};
}

export const dayAndTimeFns = {
	minutesBetween(a: DayAndTime, b: DayAndTime): Minutes {
		const aDate = new Date(`${a.day.value}T${a.time.value}`);
		const bDate = new Date(`${b.day.value}T${b.time.value}`);
		const diff = bDate.getTime() - aDate.getTime();
		return minutes(diff / 1000 / 60);
	},
	gt: (a: DayAndTime, b: DayAndTime) => {
		const aDate = new Date(`${a.day.value}T${a.time.value}`);
		const bDate = new Date(`${b.day.value}T${b.time.value}`);
		return aDate.getTime() > bDate.getTime();
	},
	gte(a: DayAndTime, b: DayAndTime) {
		return this.gt(a, b) || this.equals(a, b);
	},
	equals(a: DayAndTime, b: DayAndTime) {
		return a.day.value === b.day.value && a.time.value === b.time.value;
	},
	addDuration(d: DayAndTime, duration: Duration): DayAndTime {
		const start = dayjs.utc(`${d.day.value}T${d.time.value}`);
		const end = start.add(durationFns.toMinutes(duration).value, 'minute');
		return dayAndTime(isoDate(end.format('YYYY-MM-DD')), time24(end.format('HH:mm')));
	},
	now(tz: Timezone): DayAndTime {
		const nowInTz = dayjs().tz(tz.value);
		return dayAndTime(
			isoDate(nowInTz.format('YYYY-MM-DD')),
			time24(nowInTz.format('HH:mm'))
		);
	}
};
