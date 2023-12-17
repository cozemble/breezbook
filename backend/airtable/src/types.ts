import {v4 as uuidv4} from 'uuid';
import {mandatory} from "./utils.js";

export interface ValueType<T> {
    value: T;
}

export interface TenantId extends ValueType<string> {
    _type: 'tenant.id';
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

const time24Fns = {
    addMinutes: (time: TwentyFourHourClockTime, minutes: number): TwentyFourHourClockTime => {
        const timeParts = time.value.split(':');
        const hours = parseInt(timeParts[0]);
        const mins = parseInt(timeParts[1]);
        const newMins = mins + minutes;
        const newHours = hours + Math.floor(newMins / 60);
        const newMinsMod60 = newMins % 60;
        return time24(`${newHours}:${newMinsMod60 < 10 ? '0' : ''}${newMinsMod60}`, time.timezone);
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

export function tenantId(value: string): TenantId {
    return {
        _type: 'tenant.id',
        value,
    };
}

export function serviceId(value: string): ServiceId {
    return {
        _type: 'service.id',
        value,
    };
}

export interface TimeRangeAvailability {
    _type: 'time.range.availability';
    timeRange: TimePeriod
}

export function timeRangeAvailability(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime): TimeRangeAvailability {
    return {
        _type: 'time.range.availability',
        timeRange: timePeriod(from, to),
    };
}

export type AvailabilitySpec = TimeRangeAvailability;

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
    description: string;
    slot: TimePeriod
}

export function timeslotSpec(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime, description: string): TimeslotSpec {
    return {
        _type: 'timeslot.spec',
        description,
        slot: timePeriod(from, to),
    };
}

export interface DayAvailability {
    _type: 'day.availability';
    day: string;
    availability: AvailabilitySpec[];
}

export function dayAvailability(day: string, availability: AvailabilitySpec[]): DayAvailability {
    return {
        _type: 'day.availability',
        day,
        availability,
    };
}

export interface AvailabilityCalendar {
    _type: 'availability.calendar';
    availability: DayAvailability[];
}

export function availabilityCalendar(availability: DayAvailability[]): AvailabilityCalendar {
    return {
        _type: 'availability.calendar',
        availability,
    };
}

export interface BusinessAvailability {
    _type: 'business.availability';
    timezone?: Timezone;
    availability: AvailabilityCalendar;
}

export function businessAvailability(availability: AvailabilityCalendar, timezone?: Timezone): BusinessAvailability {
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
    date: string;
    slot: BookableSlot;
    serviceId: ServiceId;
}

export function booking(customerId: CustomerId, serviceId: ServiceId, date: string, slot: BookableSlot): Booking {
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

export interface Resource {
    _type: 'resource';
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

export function resource(type: ResourceType, name: string): Resource {
    return {
        _type: 'resource',
        id: resourceId(uuidv4()),
        type,
        name,
    };
}

export interface BusinessConfiguration {
    _type: 'business.configuration';
    availability: BusinessAvailability;
    resources: Resource[];
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

export function businessConfiguration(availability: BusinessAvailability, resources: Resource[], services: Service[], timeslots: TimeslotSpec[], startTimeSpec: StartTimeSpec): BusinessConfiguration {
    return {
        _type: 'business.configuration',
        availability,
        resources,
        services,
        timeslots,
        startTimeSpec,
    };
}


export interface BookableTimeSlots {
    date: string;
    bookableSlots: TimeslotSpec[];
}

export interface BookableTimes {
    date: string;
    bookableTimes: ExactTimeAvailability[];
}

interface AvailableResources {
    date: string;
    resources: Resource[];
}

function availableResources(date: string, resources: Resource[]): AvailableResources {
    return {
        date,
        resources,
    };
}

export function bookableTimeSlots(date: string, bookableSlots: TimeslotSpec[]): BookableTimeSlots {
    return {
        date,
        bookableSlots,
    };
}

function listDays(fromDate: string, toDate: string) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const dates = [];
    for (let date = from; date <= to; date.setDate(date.getDate() + 1)) {
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

function hasNecessaryResources(date: string, slot: BookableSlot, service: Service, bookingWithResourceUsage: BookingWithResourceUsage[], availableResources: AvailableResources[]): boolean {
    const slotDuration = calcServiceTime(slot, service.duration)
    const resourcesUsedDuringSlot = bookingWithResourceUsage.filter(r => {
        const serviceTime = calcServiceTime(r.booking.slot, service.duration);
        return r.booking.date === date && timePeriodFns.overlaps(serviceTime, slotDuration);
    }).flatMap(r => r.resources);
    const availableResourcesOnDay: AvailableResources[] = availableResources.filter(r => r.date === date) ?? [] as AvailableResources[];
    const resourcesTypesAvailable = availableResourcesOnDay.flatMap(a => a.resources).filter(r => !resourcesUsedDuringSlot.find(used => used.id.value === r.id.value)).map(r => r.type);
    return service.resourceTypes.every(rt => resourcesTypesAvailable.find(rta => rta.value === rt.value));
}

function calcServiceTime(slot: BookableSlot, serviceDuration: number): TimePeriod {
    if (slot._type === 'exact.time.availability') {
        const fromTime = slot.time;
        const toTime = time24Fns.addMinutes(slot.time, serviceDuration);
        return timePeriod(fromTime, toTime);
    }
    return slot.slot;
}

interface BookingWithResourceUsage {
    booking: Booking;
    resources: Resource[]
}

interface ResourceTimeSlot {
    resourceId: string;
    date: string;
    allocatedTime: TimePeriod;
}


function assignResourcesToBookings(config: BusinessConfiguration, bookings: Booking[]): BookingWithResourceUsage[] {
    const resourceTimeSlots: ResourceTimeSlot[] = [];
    return bookings.map(booking => {
        const bookedService = mandatory(config.services.find(s => s.id.value === booking.serviceId.value), `Service with id ${booking.serviceId.value} not found`);
        const serviceTime = calcServiceTime(booking.slot, bookedService.duration);
        const bookedResources = bookedService.resourceTypes.map((rt: ResourceType) => {
            const possibleResources = config.resources.filter(r => r.type.value === rt.value);
            const resource = possibleResources.find(r => !resourceTimeSlots.find(rts => rts.date === booking.date && rts.resourceId === r.id.value && timePeriodFns.overlaps(rts.allocatedTime, serviceTime)));
            if (!resource) {
                throw new Error(`No resource of type '${rt.value}' available for booking ${booking.id.value}`);
            }
            resourceTimeSlots.push({resourceId: resource.id.value, allocatedTime: serviceTime, date: booking.date});
            return resource;
        })
        return {
            booking,
            resources: bookedResources,
        }
    })

}

function applyBusinessHours(availability: BusinessAvailability, slot: BookableTimeSlots): BookableTimeSlots {
    const dayAvailability = availability.availability.availability.find(a => a.day === slot.date);
    if (!dayAvailability) {
        return bookableTimeSlots(slot.date, [])
    }
    const availableSlots = slot.bookableSlots.filter(s => dayAvailability.availability.find(availability => {
        return timePeriodFns.overlaps(availability.timeRange, s.slot)
    }))
    return bookableTimeSlots(slot.date, availableSlots);
}

function calculateTimeslotAvailability(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, dates: string[]): BookableTimeSlots[] {
    const allSlotsForAllDays = dates.map(date => bookableTimeSlots(date, config.timeslots)).map(timeslot => applyBusinessHours(config.availability, timeslot));
    const allResourcesForAllDays = dates.map(date => availableResources(date, config.resources));
    const bookingsWithResources = assignResourcesToBookings(config, bookingsInDateRange);
    return allSlotsForAllDays.map(slotsForDay => {
        const slotsWithResources = slotsForDay.bookableSlots.filter(slot => hasNecessaryResources(slotsForDay.date, slot, service, bookingsWithResources, allResourcesForAllDays));
        return bookableTimeSlots(slotsForDay.date, slotsWithResources)
    })
}

function calculatePeriodicStartTimes(config: BusinessConfiguration, date: string, bookingsWithResources: BookingWithResourceUsage[], service: Service, allResources: Resource[]): ExactTimeAvailability[] {
    return []
}

function calculateDiscreteStartTimes(discreteStartTimes: DiscreteStartTimes, config: BusinessConfiguration, date: string, bookingsWithResources: BookingWithResourceUsage[], service: Service, allResources: Resource[]): ExactTimeAvailability[] {
    const availableTimes = discreteStartTimes.times.filter(time => hasNecessaryResources(date, exactTimeAvailability(time), service, bookingsWithResources, [availableResources(date, allResources)]));
    return availableTimes.map(time => exactTimeAvailability(time));
}

function calculateExactTimeAvailabilityForDate(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, date: string): BookableTimes {
    const bookingsWithResources = assignResourcesToBookings(config, bookingsInDateRange);
    const availableTimes = config.startTimeSpec._type === 'periodic.start.time' ? calculatePeriodicStartTimes(config, date, bookingsWithResources, service, config.resources) : calculateDiscreteStartTimes(config.startTimeSpec, config, date, bookingsWithResources, service, config.resources);
    return {
        date,
        bookableTimes: availableTimes
    };

}

function calculateExactTimeAvailability(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, dates: string[]): BookableTimes[] {
    return dates.map(date => calculateExactTimeAvailabilityForDate(config, bookingsInDateRange, service, date));
}

export function calculateAvailability(config: BusinessConfiguration, bookings: Booking[], serviceId: ServiceId, fromDate: string, toDate: string): BookableTimeSlots[] | BookableTimes[] {
    const service = mandatory(config.services.find(s => s.id.value === serviceId.value), `Service with id ${serviceId.value} not found`);
    const bookingsInDateRange = bookings.filter(b => b.date >= fromDate && b.date <= toDate);
    const dates = listDays(fromDate, toDate);
    if (service.requiresTimeslot) {
        return calculateTimeslotAvailability(config, bookingsInDateRange, service, dates);
    }
    return calculateExactTimeAvailability(config, bookingsInDateRange, service, dates);
}

export interface TimePeriod {
    _type: 'time.period';
    from: TwentyFourHourClockTime;
    to: TwentyFourHourClockTime;
}

export function timePeriod(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime): TimePeriod {
    return {
        _type: 'time.period',
        from,
        to,
    };
}

export const timePeriodFns = {
    overlaps: (period1: TimePeriod, period2: TimePeriod): boolean => {
        return period1.from.value <= period2.from.value && period1.to.value >= period2.to.value;
    }
}

