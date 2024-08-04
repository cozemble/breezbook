import { v4 as uuidv4, v4 as uuid } from 'uuid';
import { utc } from './dayjs.js';

export interface ValueType<T> {
	_type: unknown;
	value: T;
}

type IdLike = { value: string };

export interface Identified {
	id: IdLike;
}

export const byId = {
	find<I extends IdLike, T extends Identified>(items: T[], id: I): T {
		const found = items.find(i => i.id.value === id.value);
		if (!found) {
			throw new Error(`No item with id ${id.value}`);
		}
		return found;
	},
	maybeFind(items: Identified[], id: string): Identified | null {
		return items.find(i => i.id.value === id) || null;
	}
};

export const values = {
	isEqual: (value1: ValueType<unknown>, value2: ValueType<unknown>): boolean => {
		return value1.value === value2.value && value1._type === value2._type;
	}
};

export interface EnvironmentId extends ValueType<string> {
	_type: 'environment.id';
}

export function environmentId(value: string): EnvironmentId {
	return {
		_type: 'environment.id',
		value
	};
}

export interface TenantId extends ValueType<string> {
	_type: 'tenant.id';
}

export interface Minutes extends ValueType<number> {
	_type: 'minutes';
}

export function tenantId(value: string): TenantId {
	return {
		_type: 'tenant.id',
		value
	};
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

export interface LanguageId extends ValueType<string> {
	_type: 'language.id';
}

export function languageId(value: string): LanguageId {
	return {
		_type: 'language.id',
		value
	};
}

export const languages = {
	en: languageId('en'),
	tr: languageId('tr')
};

export interface LocationId extends ValueType<string> {
	_type: 'location.id';
}

export function locationId(value: string): LocationId {
	return {
		_type: 'location.id',
		value
	};
}

export interface TenantEnvironment {
	_type: 'tenant.environment';
	environmentId: EnvironmentId;
	tenantId: TenantId;
}

export function tenantEnvironment(environmentId: EnvironmentId, tenantId: TenantId): TenantEnvironment {
	return {
		_type: 'tenant.environment',
		environmentId,
		tenantId
	};
}

export interface TenantEnvironmentLocation {
	_type: 'tenant.environment.location';
	environmentId: EnvironmentId;
	tenantId: TenantId;
	locationId: LocationId;
}

export function tenantEnvironmentLocation(environmentId: EnvironmentId, tenantId: TenantId, locationId: LocationId): TenantEnvironmentLocation {
	return {
		_type: 'tenant.environment.location',
		environmentId,
		tenantId,
		locationId
	};
}

export interface IsoDate extends ValueType<string> {
	_type: 'iso.date';
}

export function isoDate(value: string = utc().format('YYYY-MM-DD')): IsoDate {
	if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
		throw new Error(`Invalid date format ${value}. Expected YYYY-MM-DD`);
	}
	return {
		_type: 'iso.date',
		value
	};
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
export const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const mondayToFriday: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const isoDateFns = {
	isEqual(date1: IsoDate, date2: IsoDate): boolean {
		return date1.value === date2.value;
	},
	today(): IsoDate {
		return isoDate();
	},
	sameDay(date1: IsoDate, date2: IsoDate) {
		return this.isEqual(date1, date2);
	},
	listDays(fromDate: IsoDate, toDate: IsoDate) {
		const from = new Date(fromDate.value);
		const to = new Date(toDate.value);
		const dates: IsoDate[] = [];
		let currentDate = from;
		while (currentDate <= to) {
			dates.push(isoDate(utc(currentDate).format('YYYY-MM-DD')));
			currentDate = utc(currentDate).add(1, 'day').toDate();
		}
		return dates;
	},
	addDays(date: IsoDate, days: number) {
		return isoDate(utc(date.value).add(days, 'day').format('YYYY-MM-DD'));
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
	toJavascriptDate(date: IsoDate, time: TwentyFourHourClockTime = time24('00:00')) {
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
	next(dayOfWeek: DayOfWeek): IsoDate {
		const twoWeeks = [...daysOfWeek, ...daysOfWeek];
		const todayIndex = twoWeeks.indexOf(this.dayOfWeek(isoDate()));
		const dayIndex = twoWeeks.indexOf(dayOfWeek, todayIndex);
		const daysToAdd = dayIndex - todayIndex;
		return this.addDays(isoDate(), daysToAdd);
	},
	daysUntil(other: IsoDate): number {
		const today = utc(isoDate().value);
		const otherDate = utc(other.value);
		return otherDate.diff(today, 'days');
	},
	isWeekend(date: IsoDate) {
		const dayOfWeek = this.dayOfWeek(date);
		return dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
	},
	daysInMonth(startOfMonth: IsoDate): IsoDate[] {
		const start = new Date(startOfMonth.value);
		const end = new Date(utc(start).endOf('month').format('YYYY-MM-DD'));
		return this.listDays(startOfMonth, isoDate(utc(end).format('YYYY-MM-DD')));
	},
	daysBetween(a: IsoDate, b: IsoDate): number {
		return utc(b.value).diff(a.value, 'days');
	},
	addMonths(start: IsoDate, months: number): IsoDate {
		return isoDate(utc(start.value).add(months, 'month').format('YYYY-MM-DD'));
	},
	startOfMonth(d: IsoDate): IsoDate {
		return isoDate(utc(d.value).startOf('month').format('YYYY-MM-DD'));
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
	addDuration(d: DayAndTime, duration: Duration): DayAndTime {
		const asUtc = utc(`${d.day.value}T${d.time.value}`)
		const newDate = asUtc.add(durationFns.toMinutes(duration).value, 'minute');
		return dayAndTime(isoDate(newDate.format('YYYY-MM-DD')), time24(newDate.format('HH:mm')));
	}
};

export interface ServiceId extends ValueType<string> {
	_type: 'service.id';
}

export interface Timezone extends ValueType<string> {
	_type: 'timezone';
}

export interface TwentyFourHourClockTime extends ValueType<string> {
	_type: 'twenty.four.hour.clock.time';
	timezone?: Timezone;
}

export function time24(value: string, timezone?: Timezone): TwentyFourHourClockTime {
	if (!value.match(/^\d{2}:\d{2}$/)) {
		throw new Error(`Invalid time format '${value}' - expected HH:MM`);
	}
	return {
		_type: 'twenty.four.hour.clock.time',
		value,
		timezone
	};
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

		return time24(`${paddedHours}:${paddedMins}`, time.timezone);
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
	fromHoursAndMinutes(hours: number, minutes: number): TwentyFourHourClockTime {
		const paddedHours = hours.toString().padStart(2, '0');
		const paddedMins = minutes.toString().padStart(2, '0');
		return time24(`${paddedHours}:${paddedMins}`);
	},
	addDays(start: IsoDate, days: Days | number): IsoDate {
		const numberOfDays = typeof days === 'number' ? days : days.value;
		return isoDate(utc(start.value).add(numberOfDays, 'day').format('YYYY-MM-DD'));
	},
	addDuration(time: TwentyFourHourClockTime, duration: Duration): TwentyFourHourClockTime {
		return time24Fns.addMinutes(time, durationFns.toMinutes(duration));
	}
};

export function resourceType(value: string): ResourceType {
	return {
		_type: 'resource.type',
		value
	};
}

export const resourceTypeFns = {
	findByValue(resourceTypes: ResourceType[], value: string): ResourceType {
		const found = resourceTypes.find(rt => rt.value === value);
		if (!found) {
			throw new Error(`No resource type with value ${value}`);
		}
		return found;
	}
};

export function timezone(value: string): Timezone {
	return {
		_type: 'timezone',
		value
	};
}

export interface ResourceType extends ValueType<string> {
	_type: 'resource.type';
}

export interface BookingId extends ValueType<string> {
	_type: 'booking.id';
}

export function bookingId(value = uuidv4()): BookingId {
	return {
		_type: 'booking.id',
		value
	};
}

export interface ResourceId extends ValueType<string> {
	_type: 'resource.id';
}

export function serviceId(value = uuidv4()): ServiceId {
	return {
		_type: 'service.id',
		value
	};
}

export interface ExactTimeAvailability {
	_type: 'exact.time.availability';
	time: TwentyFourHourClockTime;
}

export function exactTimeAvailability(time: TwentyFourHourClockTime): ExactTimeAvailability {
	return {
		_type: 'exact.time.availability',
		time
	};
}

export interface Id extends ValueType<string> {
	_type: 'id';
}

export function id(value = uuid()): Id {
	if (value === null || value === undefined) {
		throw new Error('id value cannot be null or undefined');
	}
	return {
		_type: 'id',
		value
	};
}

export const makeId = id;

export interface Email extends ValueType<string> {
	_type: 'email';
}

export function email(value: string): Email {
	return {
		_type: 'email',
		value
	};
}

export interface PhoneNumber extends ValueType<string> {
	_type: 'phone.number';
}

export function phoneNumber(e164: string): PhoneNumber {
	const regEx = /^\+[1-9]\d{1,14}$/;
	if (!e164.match(regEx)) {
		throw new Error(`Invalid phone number format ${e164}. Expected E.164 format`);
	}
	return {
		_type: 'phone.number',
		value: e164
	};
}

export interface Capacity extends ValueType<number> {
	_type: 'capacity';
}

export function capacity(value: number): Capacity {
	return {
		_type: 'capacity',
		value
	};
}

export const capacityFns = {
	sum: (a: Capacity, ...others: Capacity[]) => capacity(a.value + others.reduce((acc, c) => acc + c.value, 0))
};

export function resourceId(value = uuidv4()): ResourceId {
	return {
		_type: 'resource.id',
		value
	};
}

export interface AddOnId extends ValueType<string> {
	_type: 'add.on.id';
}

export function addOnId(value: string): AddOnId {
	return {
		_type: 'add.on.id',
		value
	};
}

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
		return remainingTimePeriods.map((tp) => dayAndTimePeriod(da.day, tp));
	},
	intersection(period1: DayAndTimePeriod, period2: DayAndTimePeriod) {
		return dayAndTimePeriod(
			period1.day,
			timePeriod(
				timePeriodFns.startsEarlier(period1.period, period2.period) ? period2.period.from : period1.period.from,
				timePeriodFns.endsLater(period1.period, period2.period) ? period2.period.to : period1.period.to
			)
		);
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
		return duration(minutes(utc(`2021-01-01T${t.to.value}`).diff(`2021-01-01T${t.from.value}`, 'minutes')));

	}
};

export interface FormId extends ValueType<string> {
	_type: 'form.id';
}

export function formId(value = uuidv4()): FormId {
	return {
		_type: 'form.id',
		value
	};
}

export interface JsonSchemaForm {
	_type: 'json.schema.form';
	id: FormId;
	name: string;
	description?: string;
	schema: unknown;
}

export function jsonSchemaForm(id: FormId, name: string, schema: unknown, description?: string): JsonSchemaForm {
	return {
		_type: 'json.schema.form',
		id,
		name,
		schema,
		description
	};
}

export const jsonSchemaFormFns = {
	extractLabels: (form: JsonSchemaForm, languageId: LanguageId): JsonSchemaFormLabels => {
		const schema = form.schema as any;
		const keyLabels = Object.keys(schema.properties).map(key => {
			const itemDef = schema.properties[key];
			return schemaKeyLabel(key, key, itemDef.description);
		});
		return jsonSchemaFormLabels(form.id, languageId, form.name, keyLabels, form.description);
	},
	applyLabels(form: JsonSchemaForm, labels: JsonSchemaFormLabels) {
		const schema = form.schema as any;
		const propertyKeys = Object.keys(schema.properties);
		const labeledProperties = propertyKeys.reduce((acc, key) => {
			const itemDef = schema.properties[key];
			const label = labels.schemaKeyLabels.find(sl => sl.schemaKey === key);
			if (!label) {
				return { ...acc, [key]: itemDef };
			}
			return {
				...acc,
				[key]: {
					...itemDef,
					title: label.label,
					description: label.description
				}
			};
		}, {});
		return {
			...form,
			name: labels.name,
			description: labels.description,
			schema: {
				...schema,
				properties: labeledProperties
			}
		};
	}
};

export interface SchemaKeyLabel {
	_type: 'schema.key.label';
	schemaKey: string;
	label: string;
	description?: string;
}

export function schemaKeyLabel(schemaKey: string, label: string, description?: string): SchemaKeyLabel {
	return {
		_type: 'schema.key.label',
		schemaKey,
		label,
		description
	};
}

export interface JsonSchemaFormLabels {
	_type: 'json.schema.form.labels';
	formId: FormId;
	languageId: LanguageId;
	name: string;
	description?: string;
	schemaKeyLabels: SchemaKeyLabel[];
}

export function jsonSchemaFormLabels(formId: FormId, languageId: LanguageId, name: string, schemaKeyLabels: SchemaKeyLabel[], description?: string): JsonSchemaFormLabels {
	return {
		_type: 'json.schema.form.labels',
		formId,
		languageId,
		name,
		description,
		schemaKeyLabels
	};
}

export type Form = JsonSchemaForm;

export interface CouponCode extends ValueType<string> {
	_type: 'coupon.code';
}

export function couponCode(value: string): CouponCode {
	return {
		_type: 'coupon.code',
		value
	};
}

export interface CouponId extends ValueType<string> {
	_type: 'coupon.id';
}

export function couponId(value: string): CouponId {
	return {
		_type: 'coupon.id',
		value
	};
}


export interface OrderId extends ValueType<string> {
	_type: 'order.id';
}

export function orderId(value = uuid()): OrderId {
	return {
		_type: 'order.id',
		value
	};
}

export interface ResourceRequirementId extends ValueType<string> {
	_type: 'resource.requirement.id';
}

export function resourceRequirementId(value = uuidv4()): ResourceRequirementId {
	return {
		_type: 'resource.requirement.id',
		value
	};
}

export function mandatory<T>(value: T | undefined | null, errorMessage: string): T {
	if (value === null || value === undefined) {
		throw new Error(errorMessage);
	}
	return value as T;
}

export type Metadata = Record<string, string | number | boolean>

export interface ServiceOptionId extends ValueType<string> {
	_type: 'service.option.id';
}

export function serviceOptionId(value: string): ServiceOptionId {
	return {
		_type: 'service.option.id',
		value
	};
}


export interface ServiceOptionRequest {
	serviceOptionId: ServiceOptionId;
	quantity: number;
}

export function serviceOptionRequest(serviceOptionId: ServiceOptionId, quantity = 1): ServiceOptionRequest {
	return {
		serviceOptionId,
		quantity
	};
}

export interface KeyValue {
	_type: 'key.value';
	key: string;
	value: string;
}

export function keyValue(key: string, value: string): KeyValue {
	return {
		_type: 'key.value',
		key,
		value
	};
}

