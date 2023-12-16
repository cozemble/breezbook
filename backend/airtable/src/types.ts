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

export interface Date {
    _type: 'date';
    year: number;
    month: number;
    day: number;
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
    from: TwentyFourHourClockTime;
    to: TwentyFourHourClockTime;
}

export function timeRangeAvailability(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime): TimeRangeAvailability {
    return {
        _type: 'time.range.availability',
        from,
        to,
    };
}

export type AvailabilitySpec = ExactAvailabilitySpec | TimeRangeAvailability;

export interface ExactAvailabilitySpec {
    _type: 'exact.time.availability';
    description?: string;
    time: TwentyFourHourClockTime
}

export function exactAvailability(time: TwentyFourHourClockTime, description?: string): ExactAvailabilitySpec {
    return {
        _type: 'exact.time.availability',
        description,
        time,
    };
}

export interface TimeslotSpec {
    _type: 'timeslot.spec';
    description: string;
    from: TwentyFourHourClockTime
    to: TwentyFourHourClockTime
}

export function timeslotSpec(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime, description: string): TimeslotSpec {
    return {
        _type: 'timeslot.spec',
        description,
        from,
        to,
    };
}

export interface BusinessAvailability {
    _type: 'business.availability';
    timezone?: Timezone;
    availability: AvailabilitySpec[];
}

export function businessAvailability(availability: AvailabilitySpec[], timezone?: Timezone): BusinessAvailability {
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

export type BookableSlot = ExactAvailabilitySpec | TimeslotSpec;

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
}

export function businessConfiguration(availability: BusinessAvailability, resources: Resource[], services: Service[], timeslots: TimeslotSpec[]): BusinessConfiguration {
    return {
        _type: 'business.configuration',
        availability,
        resources,
        services,
        timeslots,
    };
}


export interface BookableSlots {
    date: string;
    bookableSlots: BookableSlot[];
}

interface AvailableResources {
    date: string;
    resources: Resource[];
}

interface BookingsByDate {
    date: string;
    bookings: Booking[];

}

function availableResources(date: string, resources: Resource[]): AvailableResources {
    return {
        date,
        resources,
    };
}

export function bookableSlots(date: string, bookableSlots: BookableSlot[]): BookableSlots {
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
    if (slot._type === 'exact.time.availability') {
        throw new Error(`Can't handle exact time availability yet`);
    }
    const resourcesUsedDuringSlot = bookingWithResourceUsage.filter(r => {
        const {fromTime, toTime} = calcFromAndToTimes(r.booking.slot, service.duration);
        return r.booking.date === date && fromTime.value < slot.to.value && toTime.value > slot.from.value;
    }).flatMap(r => r.resources);
    const availableResourcesOnDay: AvailableResources[] = availableResources.filter(r => r.date === date) ?? [] as AvailableResources[];
    const resourcesTypesAvailable = availableResourcesOnDay.flatMap(a => a.resources).filter(r => !resourcesUsedDuringSlot.find(used => used.id.value === r.id.value)).map(r => r.type);
    return service.resourceTypes.every(rt => resourcesTypesAvailable.find(rta => rta.value === rt.value));
}

function calcFromAndToTimes(slot: BookableSlot, serviceDuration: number) {
    if (slot._type === 'exact.time.availability') {
        const fromTime = slot.time;
        const toTime = time24Fns.addMinutes(slot.time, serviceDuration);
        return {fromTime, toTime};
    }
    const fromTime = slot.from;
    const toTime = slot.to;
    return {fromTime, toTime};
}

interface BookingWithResourceUsage {
    booking: Booking;
    resources: Resource[]
}

interface ResourceTimeSlot {
    resourceId: string;
    fromTime: string;
    toTime: string;
}


function assignResourcesToBookings(config: BusinessConfiguration, bookings: Booking[]): BookingWithResourceUsage[] {
    const resourceTimeSlots: ResourceTimeSlot[] = [];
    return bookings.map(booking => {
        const bookedService = mandatory(config.services.find(s => s.id.value === booking.serviceId.value), `Service with id ${booking.serviceId.value} not found`);
        const {fromTime, toTime} = calcFromAndToTimes(booking.slot, bookedService.duration);
        const bookedResources = bookedService.resourceTypes.map((rt: ResourceType) => {
            const possibleResources = config.resources.filter(r => r.type.value === rt.value);
            const resource = possibleResources.find(r => !resourceTimeSlots.find(rts => rts.resourceId === r.id.value && rts.fromTime < toTime.value && rts.toTime > fromTime.value));
            if (!resource) {
                throw new Error(`No resource of type ${rt.value} available for booking ${booking.id.value}`);
            }
            resourceTimeSlots.push({resourceId: resource.id.value, fromTime: fromTime.value, toTime: toTime.value});
            return resource;
        })
        return {
            booking,
            resources: bookedResources,
        }
    })

}

function calculateTimeslotAvailability(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, fromDate: string, toDate: string): BookableSlots[] {
    const dates = listDays(fromDate, toDate);
    const allSlotsForAllDays = dates.map(date => bookableSlots(date, config.timeslots));
    const allResourcesForAllDays = dates.map(date => availableResources(date, config.resources));
    const bookingsWithResources = assignResourcesToBookings(config, bookingsInDateRange);
    // const resourceUsageByDateAndTime = bookingsInDateRange.flatMap(booking => {
    //     const bookedService = mandatory(config.services.find(s => s.id.value === booking.serviceId.value), `Service with id ${booking.serviceId.value} not found`);
    //     const bookedResources = bookedService.resourceTypes.flatMap((rt: ResourceType) => config.resources.find(r => r.type.value === rt.value));
    //     return bookedResources.map(r => {
    //         const {fromTime, toTime} = calcFromAndToTimes(booking.slot, bookedService.duration);
    //         const usage: ResourceUsage = {
    //             date: booking.date,
    //             fromTime,
    //             toTime,
    //             resource: r,
    //             bookedServiceId: booking.serviceId,
    //         }
    //         return usage
    //     });
    // })
    return allSlotsForAllDays.map(slotsForDay => {
        const slotsWithResources = slotsForDay.bookableSlots.filter(slot => hasNecessaryResources(slotsForDay.date, slot, service, bookingsWithResources, allResourcesForAllDays));
        return bookableSlots(slotsForDay.date, slotsWithResources)
    })
}

export function calculateAvailability(config: BusinessConfiguration, bookings: Booking[], serviceId: ServiceId, fromDate: string, toDate: string): BookableSlots[] {
    const service = mandatory(config.services.find(s => s.id.value === serviceId.value), `Service with id ${serviceId.value} not found`);
    const bookingsInDateRange = bookings.filter(b => b.date >= fromDate && b.date <= toDate);
    if (service.requiresTimeslot) {
        return calculateTimeslotAvailability(config, bookingsInDateRange, service, fromDate, toDate);
    }
    throw new Error(`Can only do timeslots right now`);
}

