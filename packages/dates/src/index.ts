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

export interface IsoDate {
	_type: 'iso.date';
	value: string;
	timezone: Timezone;
}

export function isoDate(timezone: Timezone, value: string): IsoDate {
	if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
		throw new Error(`Invalid date format ${value}. Expected YYYY-MM-DD`);
	}
	return { _type: 'iso.date', value, timezone };
}

export interface TwentyFourHourClockTime {
	_type: 'twenty.four.hour.clock.time';
	value: string;
	timezone: Timezone;
}

export function time24(timezone: Timezone, value: string): TwentyFourHourClockTime {
	if (!value.match(/^\d{2}:\d{2}$/)) {
		throw new Error(`Invalid time format '${value}' - expected HH:MM`);
	}
	return { _type: 'twenty.four.hour.clock.time', value, timezone };
}

export interface ValueType<T> {
	_type: unknown;
	value: T;
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


export type DurationUnit = Minutes | Days | Hours

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

		return time24(time.timezone, `${paddedHours}:${paddedMins}`);
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
		return a.value === b.value && a.timezone.value === b.timezone.value;
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
	fromHoursAndMinutes(hours: number, minutes: number, timezone: Timezone): TwentyFourHourClockTime {
		const paddedHours = hours.toString().padStart(2, '0');
		const paddedMins = minutes.toString().padStart(2, '0');
		return time24(timezone, `${paddedHours}:${paddedMins}`);
	},
	addDays(start: IsoDate, days: Days | number): IsoDate {
		const numberOfDays = typeof days === 'number' ? days : days.value;
		const startDate = dayjs.tz(start.value, start.timezone.value);
		const endDate = startDate.add(numberOfDays, 'day');
		return isoDate(start.timezone, endDate.format('YYYY-MM-DD'));
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
	if (date.timezone.value !== time.timezone.value) {
		throw new Error('Date and time must be in the same timezone');
	}
	return { _type: 'date.and.time', date, time };
}

export const dateAndTimeFns = {
	now(timezone: Timezone): DateAndTime {
		const now = dayjs().tz(timezone.value);
		return dateAndTime(
			isoDate(timezone, now.format('YYYY-MM-DD')),
			time24(timezone, now.format('HH:mm'))
		);
	},

	toUTC(dt: DateAndTime): string {
		return dayjs.tz(`${dt.date.value} ${dt.time.value}`, dt.date.timezone.value).utc().format();
	},

	fromUTC(utcString: string, timezone: Timezone): DateAndTime {
		const localDateTime = dayjs(utcString).tz(timezone.value);
		return dateAndTime(
			isoDate(timezone, localDateTime.format('YYYY-MM-DD')),
			time24(timezone, localDateTime.format('HH:mm'))
		);
	},

	add(dt: DateAndTime, minutes: number): DateAndTime {
		const newDateTime = dayjs.tz(`${dt.date.value} ${dt.time.value}`, dt.date.timezone.value).add(minutes, 'minute');
		return dateAndTime(
			isoDate(dt.date.timezone, newDateTime.format('YYYY-MM-DD')),
			time24(dt.date.timezone, newDateTime.format('HH:mm'))
		);
	},

	isBefore(dt1: DateAndTime, dt2: DateAndTime): boolean {
		return dayjs.tz(`${dt1.date.value} ${dt1.time.value}`, dt1.date.timezone.value)
			.isBefore(dayjs.tz(`${dt2.date.value} ${dt2.time.value}`, dt2.date.timezone.value));
	},

	isAfter(dt1: DateAndTime, dt2: DateAndTime): boolean {
		return dayjs.tz(`${dt1.date.value} ${dt1.time.value}`, dt1.date.timezone.value)
			.isAfter(dayjs.tz(`${dt2.date.value} ${dt2.time.value}`, dt2.date.timezone.value));
	},

	equals(dt1: DateAndTime, dt2: DateAndTime): boolean {
		return this.toUTC(dt1) === this.toUTC(dt2);
	}
};

export const isoDateFns = {
	isEqual(date1: IsoDate, date2: IsoDate): boolean {
		return date1.value === date2.value;
	},
	today(timezone: Timezone): IsoDate {
		return isoDate(timezone, dayjs().format('YYYY-MM-DD'));
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
		return isoDate(date.timezone, dayjs.tz(date.value, date.timezone.value).add(days, 'day').format('YYYY-MM-DD'));
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
		const today = isoDateFns.today(other.timezone);
		return dayjs.tz(other.value, other.timezone.value).diff(today.value, 'days');
	},
	isWeekend(date: IsoDate) {
		const dayOfWeek = this.dayOfWeek(date);
		return dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
	},
	daysInMonth(startOfMonth: IsoDate): IsoDate[] {
		const start = dayjs.tz(startOfMonth.value, startOfMonth.timezone.value).startOf('month');
		const end = dayjs.tz(startOfMonth.value, startOfMonth.timezone.value).endOf('month');
		return this.listDays(isoDate(startOfMonth.timezone, start.format('YYYY-MM-DD')), isoDate(startOfMonth.timezone, end.format('YYYY-MM-DD')));
	},
	daysBetween(a: IsoDate, b: IsoDate): number {
		return dayjs.tz(b.value, b.timezone.value).diff(a.value, 'days');
	},
	addMonths(d: IsoDate, months: number): IsoDate {
		return isoDate(d.timezone, dayjs.tz(d.value, d.timezone.value).add(months, 'month').format('YYYY-MM-DD'));
	},
	startOfMonth(d: IsoDate): IsoDate {
		return isoDate(d.timezone, dayjs.tz(d.value, d.timezone.value).startOf('month').format('YYYY-MM-DD'));
	}
};
