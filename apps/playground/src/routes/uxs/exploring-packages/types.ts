import { currencies, price, type Price } from '@breezbook/packages-core';
import { capacity, type Capacity, serviceId, type ServiceId, type ValueType } from '@breezbook/packages-types';
import {
	type DayOfWeek,
	dayOfWeekAndTimePeriod,
	type DayOfWeekAndTimePeriod,
	days,
	type Days,
	type IsoDate,
	isoDate,
	type Months,
	time24,
	timePeriod,
	type TwentyFourHourClockTime,
	weeks,
	type Weeks,
	years,
	type Years
} from '@breezbook/packages-date-time';
import { v4 as uuid } from 'uuid';

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
	name: string;
	description: string;
	items: PackageItem[];
	price: Price;
	validityPeriod: ValidityPeriod;
	constraints?: BookingConstraints;
}

export function createPackage(
	name: string,
	description: string,
	items: PackageItem[],
	price: Price,
	validityPeriod: ValidityPeriod,
	constraints?: BookingConstraints,
	id = packageId()
): Package {
	return { id, name, description, items, price, validityPeriod, constraints };
}

export type PackageItem = ServiceCredit | FixedPackage

export interface ServiceCredit {
	quantity: number;
	services: ServiceId[];
}

export function serviceCredit(quantity: number, services: ServiceId[]): ServiceCredit {
	return { quantity, services };
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
	serviceId: ServiceId;
	schedule: FixedPackageSchedule;
}

export function fixedPackage(serviceId: ServiceId, schedule: FixedPackageSchedule): FixedPackage {
	return { serviceId, schedule };
}

export const tenBoxingSessions = createPackage(
	'10 Boxing Sessions',
	'10 boxing sessions',
	[serviceCredit(10, [serviceId('boxing')])],
	price(25000, currencies.GBP),
	weeks(26));

export const dropADressSizeThisAutumn = createPackage(
	'Drop a Dress Size This Autumn',
	'8 weight loss PT sessions over 4 weeks, and 2 nutrition consultations',
	[
		serviceCredit(2, [serviceId('nutrition-consultation')]),
		fixedPackage(
			serviceId('personal-training'),
			specificDatesSchedule(isoDate('2024-08-20'), isoDate('2024-09-12'), capacity(12), constrainedSchedule([
				permittedSlot('Tuesday', [time24('08:00')]),
				permittedSlot('Thursday', [time24('08:00')])
			])))],
	price(50000, currencies.GBP),
	weeks(4)
);

export const dropADressSizeProgramme = createPackage(
	'Drop a Dress Size Programme',
	'8 weight loss PT sessions over 4 weeks, and 2 nutrition consultations.  ',
	[
		serviceCredit(6, [serviceId('nutrition-consultation')]),
		fixedPackage(
			serviceId('personal-training'),
			constrainedSchedule([
				permittedSlot('Tuesday', [time24('08:00')]),
				permittedSlot('Thursday', [time24('08:00')])
			]))
	],
	price(120000, currencies.GBP),
	weeks(12)
);


export const midweekLuxurySpaDay = createPackage(
	'Midweek Luxury Spa Day',
	'A full day of pampering including massage, facial, and access to spa facilities',
	[
		serviceCredit(1, [serviceId('full-body-massage')]),
		serviceCredit(1, [serviceId('facial-treatment')]),
		fixedPackage(
			serviceId('spa-access'),
			constrainedSchedule([
				permittedSlot('Tuesday', [time24('10:00')]),
				permittedSlot('Wednesday', [time24('10:00')]),
				permittedSlot('Thursday', [time24('10:00')])
			]))
	],
	price(25000, currencies.USD),
	years(1),
	bookingConstraints(["Tuesday", "Wednesday", "Thursday"])
);
