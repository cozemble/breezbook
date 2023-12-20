import {v4 as uuidv4} from 'uuid';

export interface ValueType<T> {
    _type: unknown
    value: T;
}

export const values = {
    isEqual: (value1: ValueType<unknown>, value2: ValueType<unknown>): boolean => {
        return value1.value === value2.value && value1._type === value2._type;
    }
}

export interface TenantId extends ValueType<string> {
    _type: 'tenant.id';
}

export function tenantId(value: string): TenantId {
    return {
        _type: 'tenant.id',
        value,
    };
}

export interface IsoDate extends ValueType<string> {
    _type: 'iso.date';
}

export function isoDate(value: string): IsoDate {
    if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        throw new Error(`Invalid date format ${value}. Expected YYYY-MM-DD`);
    }
    return {
        _type: 'iso.date',
        value,
    };
}

export const isoDateFns = {
    isEqual(date1: IsoDate, date2: IsoDate): boolean {
        return date1.value === date2.value;
    },
    sameDay(date1: IsoDate, date2: IsoDate) {
        return this.isEqual(date1, date2);
    }
}

export interface ServiceId extends ValueType<string> {
    _type: 'service.id';
}

export interface CustomerId extends ValueType<string> {
    _type: 'customer.id';
}

export function customerId(value: string): CustomerId {
    return {
        _type: 'customer.id',
        value,
    };
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
        throw new Error(`Invalid time format ${value}. Expected HH:MM`);
    }
    return {
        _type: 'twenty.four.hour.clock.time',
        value,
        timezone,
    };
}

export interface Duration extends ValueType<number> {
    _type: 'duration';
}

export function duration(value: number): Duration {
    return {
        _type: 'duration',
        value,
    };
}

export const time24Fns = {
    addMinutes: (time: TwentyFourHourClockTime, minutes: number): TwentyFourHourClockTime => {
        const timeParts = time.value.split(':');
        const hours = parseInt(timeParts[0]);
        const mins = parseInt(timeParts[1]);
        const newMins = mins + minutes;
        const newHours = hours + Math.floor(newMins / 60);
        const newMinsMod60 = newMins % 60;

        const paddedHours = newHours.toString().padStart(2, '0');
        const paddedMins = (newMinsMod60 < 10 ? '0' : '') + newMinsMod60;

        return time24(`${paddedHours}:${paddedMins}`, time.timezone);
    }
}

export function resourceType(value: string): ResourceType {
    return {
        _type: 'resource.type',
        value,
    };
}

export function timezone(value: string): Timezone {
    return {
        _type: 'timezone',
        value,
    };
}

export interface ResourceType extends ValueType<string> {
    _type: 'resource.type';
}

export interface BookingId extends ValueType<string> {
    _type: 'booking.id';
}

export function bookingId(value: string): BookingId {
    return {
        _type: 'booking.id',
        value,
    };
}

export interface ResourceId extends ValueType<string> {
    _type: 'resource.id';
}

export function serviceId(value: string): ServiceId {
    return {
        _type: 'service.id',
        value,
    };
}

export interface ExactTimeAvailability {
    _type: 'exact.time.availability';
    time: TwentyFourHourClockTime
}

export function exactTimeAvailability(time: TwentyFourHourClockTime): ExactTimeAvailability {
    return {
        _type: 'exact.time.availability',
        time,
    };
}

export interface TimeslotSpec {
    _type: 'timeslot.spec';
    slot: TimePeriod
    description: string;
}

export function timeslotSpec(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime, description: string): TimeslotSpec {
    return {
        _type: 'timeslot.spec',
        description,
        slot: timePeriod(from, to),
    };
}

export interface BusinessAvailability {
    _type: 'business.availability';
    timezone?: Timezone;
    availability: DayAndTimePeriod[];
}

export function businessAvailability(availability: DayAndTimePeriod[], timezone?: Timezone): BusinessAvailability {
    return {
        _type: 'business.availability',
        availability,
        timezone,
    };
}

export interface Customer {
    id: CustomerId;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export function customer(firstName: string, lastName: string, email: string, phone: string): Customer {
    return {
        id: customerId(uuidv4()),
        firstName,
        lastName,
        email,
        phone,
    };
}

export type BookableSlot = ExactTimeAvailability | TimeslotSpec;

export interface Booking {
    id: BookingId;
    customerId: CustomerId;
    date: IsoDate;
    slot: BookableSlot;
    serviceId: ServiceId;
}

export function booking(customerId: CustomerId, serviceId: ServiceId, date: IsoDate, slot: BookableSlot): Booking {
    return {
        id: bookingId(uuidv4()),
        customerId,
        date,
        slot,
        serviceId,
    };
}

export interface NumberWithoutDecimalPlaces extends ValueType<number> {
    _type: 'number.without.decimal.places';
}

export function numberWithoutDecimalPlaces(value: number): NumberWithoutDecimalPlaces {
    return {
        _type: 'number.without.decimal.places',
        value,
    };

}

export interface Currency extends ValueType<string> {
    _type: 'currency';
}

export interface Price {
    _type: 'price';
    amount: NumberWithoutDecimalPlaces;
    currency: Currency;
}

export function currency(value: string): Currency {
    return {
        _type: 'currency',
        value,
    };
}

export const GBP = currency('GBP');

export function price(amount: number, currency: Currency): Price {
    return {
        _type: 'price',
        amount: numberWithoutDecimalPlaces(amount),
        currency,
    };
}

export interface Service {
    id: ServiceId;
    name: string;
    duration: number;
    resourceTypes: ResourceType[];
    requiresTimeslot: boolean;
    price: Price;
}

export function service(name: string, resourceTypes: ResourceType[], duration: number, requiresTimeslot: boolean, price: Price): Service {
    return {
        id: serviceId(uuidv4()),
        name,
        duration,
        resourceTypes,
        requiresTimeslot,
        price
    };
}

export interface FungibleResource {
    _type: 'fungible.resource';
    id: ResourceId;
    type: ResourceType;
    name: string;
}

export function resourceId(value: string): ResourceId {
    return {
        _type: 'resource.id',
        value,
    };
}

export function resource(type: ResourceType, name: string): FungibleResource {
    return {
        _type: 'fungible.resource',
        id: resourceId(uuidv4()),
        type,
        name,
    };
}

export interface BusinessConfiguration {
    _type: 'business.configuration';
    availability: BusinessAvailability;
    resourceAvailability: ResourceDayAvailability[];
    services: Service[];
    timeslots: TimeslotSpec[];
    startTimeSpec: StartTimeSpec
}

export interface PeriodicStartTime {
    _type: 'periodic.start.time';
    period: Duration;
}

export function periodicStartTime(period: Duration): PeriodicStartTime {
    return {
        _type: 'periodic.start.time',
        period,
    };
}

export interface DiscreteStartTimes {
    _type: 'discrete.start.times';
    times: TwentyFourHourClockTime[];
}

export function discreteStartTimes(times: TwentyFourHourClockTime[]): DiscreteStartTimes {
    return {
        _type: 'discrete.start.times',
        times,
    };
}

export type StartTimeSpec = PeriodicStartTime | DiscreteStartTimes;

export function businessConfiguration(availability: BusinessAvailability, resources: ResourceDayAvailability[], services: Service[], timeslots: TimeslotSpec[], startTimeSpec: StartTimeSpec): BusinessConfiguration {
    return {
        _type: 'business.configuration',
        availability,
        resourceAvailability: resources,
        services,
        timeslots,
        startTimeSpec,
    };
}

export interface BookableTimeSlots {
    date: IsoDate;
    bookableSlots: TimeslotSpec[];
}

export interface BookableTimeSlot {
    date: IsoDate;
    slot: TimeslotSpec;
}

export function bookableTimeSlot(date: IsoDate, slot: TimeslotSpec): BookableTimeSlot {
    return {
        date,
        slot,
    };
}

export interface ResourcedTimeSlot extends BookableTimeSlot {
    resources: FungibleResource[]
    service: Service
}

export function resourcedTimeSlot(slot: BookableTimeSlot, resources: FungibleResource[], service: Service): ResourcedTimeSlot {
    return {
        ...slot,
        resources,
        service
    };
}

export interface BookableTimes {
    date: IsoDate;
    bookableTimes: ExactTimeAvailability[];
}

export interface ResourceDayAvailability {
    resource: FungibleResource
    availability: DayAndTimePeriod[]
}

export function resourceDayAvailability(resource: FungibleResource, availability: DayAndTimePeriod[]): ResourceDayAvailability {
    return {
        resource,
        availability,
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
        period,
    }
}

export const dayAndTimePeriodFns = {
    overlaps: (dayAndTimePeriod1: DayAndTimePeriod, dayAndTimePeriod2: DayAndTimePeriod): boolean => {
        return isoDateFns.isEqual(dayAndTimePeriod1.day, dayAndTimePeriod2.day) && timePeriodFns.overlaps(dayAndTimePeriod1.period, dayAndTimePeriod2.period);
    },
    splitPeriod(da: DayAndTimePeriod, bookingPeriod: DayAndTimePeriod): DayAndTimePeriod[] {
        if (!dayAndTimePeriodFns.overlaps(da, bookingPeriod)) {
            return [da];
        }
        const remainingTimePeriods = [] as TimePeriod[]
        if (timePeriodFns.startsEarlier(da.period, bookingPeriod.period)) {
            remainingTimePeriods.push(timePeriod(da.period.from, bookingPeriod.period.from))
        }
        if (timePeriodFns.endsLater(da.period, bookingPeriod.period)) {
            remainingTimePeriods.push(timePeriod(bookingPeriod.period.to, da.period.to));
        }
        return remainingTimePeriods.map(tp => dayAndTimePeriod(da.day, tp));
    },
    intersection(period1: DayAndTimePeriod, period2: DayAndTimePeriod) {
        return dayAndTimePeriod(period1.day, timePeriod(
            timePeriodFns.startsEarlier(period1.period, period2.period) ? period2.period.from : period1.period.from,
            timePeriodFns.endsLater(period1.period, period2.period) ? period2.period.to : period1.period.to
        ));
    },
    intersects(period1: DayAndTimePeriod, period2: DayAndTimePeriod) {
        return isoDateFns.sameDay(period1.day, period2.day) && timePeriodFns.intersects(period1.period, period2.period);
    }
}

export function timePeriod(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime): TimePeriod {
    return {
        _type: 'time.period',
        from,
        to,
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
        // return true if period2 has any time inside period
        return period2.from.value >= period.from.value && period2.from.value <= period.to.value
            || period2.to.value >= period.from.value && period2.to.value <= period.to.value
            || period2.from.value <= period.from.value && period2.to.value >= period.to.value;
    }
}

