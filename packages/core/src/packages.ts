import { type Capacity, LanguageId, type ServiceId, type ValueType } from '@breezbook/packages-types';
import {
	DayOfWeek,
	dayOfWeekAndTimePeriod,
	DayOfWeekAndTimePeriod,
	Days,
	IsoDate,
	Months,
	time24,
	timePeriod,
	TwentyFourHourClockTime,
	Weeks,
	Years
} from '@breezbook/packages-date-time';
import { v4 as uuid } from 'uuid';
import { Price } from './types.js';

export interface PackageId extends ValueType<string> {
	_type: 'package.id';
}

export function packageId(value = uuid()): PackageId {
	return { _type: 'package.id', value };
}

export type ValidityPeriod = Days | Weeks | Months | Years

export interface TimeConstraints {
	_type: 'time.constraints';
	permitted: DayOfWeekAndTimePeriod[];
}

export function timeConstraints(permitted: DayOfWeekAndTimePeriod[]): TimeConstraints {
	return { _type: 'time.constraints', permitted };
}

export interface BookingConstraints {
	_type: 'booking.constraints';
	times: TimeConstraints;
}

export function bookingConstraints(permitted: (DayOfWeek | DayOfWeekAndTimePeriod)[]): BookingConstraints {
	const mapped = permitted.map(p => typeof p === 'string' ? dayOfWeekAndTimePeriod(p as DayOfWeek, timePeriod(time24('00:00'), time24('23:59'))) : p);
	return { _type: 'booking.constraints', times: timeConstraints(mapped) };
}

export interface Package {
	id: PackageId;
	items: PackageItem[];
	price: Price;
	validityPeriod: ValidityPeriod;
	constraints?: BookingConstraints;
}

export interface PackageLabels {
	name: string;
	description: string;
	packageId: PackageId;
	languageId: LanguageId;
}

export function createPackage(
	items: PackageItem[],
	price: Price,
	validityPeriod: ValidityPeriod,
	constraints?: BookingConstraints,
	id = packageId()
): Package {
	return { id, items, price, validityPeriod, constraints };
}

export type PackageItem = ServiceCredit | FixedPackage

export interface ServiceCredit {
	_type: 'service.credit';
	quantity: number;
	services: ServiceId[];
}

export function serviceCredit(quantity: number, services: ServiceId[]): ServiceCredit {
	return {
		_type: 'service.credit',
		quantity,
		services
	};
}

export type FixedPackageSchedule = SpecificDatesSchedule | ConstrainedSchedule

export interface SpecificDatesSchedule {
	_type: 'specific-dates';
	startDate: IsoDate;
	endDate: IsoDate;
	schedule: ConstrainedSchedule;
	capacity: Capacity;
}

export function specificDatesSchedule(startDate: IsoDate, endDate: IsoDate, capacity: Capacity, schedule: ConstrainedSchedule): SpecificDatesSchedule {
	return { _type: 'specific-dates', startDate, endDate, schedule, capacity };
}


export interface PermittedSlot {
	dayOfWeek: DayOfWeek;
	startTimes: TwentyFourHourClockTime[];
}

export function permittedSlot(dayOfWeek: DayOfWeek, startTimes: TwentyFourHourClockTime[]): PermittedSlot {
	return { dayOfWeek, startTimes };
}

export interface ConstrainedSchedule {
	_type: 'constrained.schedule';
	permittedSlots: PermittedSlot[];
}

export function constrainedSchedule(permittedSlots: PermittedSlot[]): ConstrainedSchedule {
	return { _type: 'constrained.schedule', permittedSlots };
}

export interface FixedPackage {
	_type:'fixed.package';
	serviceId: ServiceId;
	schedule: FixedPackageSchedule;
}

export function fixedPackage(serviceId: ServiceId, schedule: FixedPackageSchedule): FixedPackage {
	return {
		_type: 'fixed.package',
		serviceId,
		schedule
	};
}