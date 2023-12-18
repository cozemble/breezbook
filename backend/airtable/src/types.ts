import {v4 as uuidv4} from 'uuid';
import {mandatory} from "./utils.js";
import {applyBookingsToResourceAvailability, fitAvailability} from "./applyBookingsToResourceAvailability.js";

export interface ValueType<T> {
    _type: unknown
    value: T;
}

export const values = {
    isEqual: (value1: ValueType<unknown>, value2: ValueType<unknown>): boolean => {
        return value1.value === value2.value && value1._type === value2._type;
    }
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

const time24Fns = {
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

// export interface AvailabilityCalendar {
//     _type: 'availability.calendar';
//     availability: DayAndTimePeriod[];
// }
//
// export function availabilityCalendar(availability: DayAndTimePeriod[]): AvailabilityCalendar {
//     return {
//         _type: 'availability.calendar',
//         availability,
//     };
// }

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

export interface BookedTimeSlot extends BookableTimeSlot {
    resources: Resource[]
}

export function bookedTimeSlot(slot: BookableTimeSlot, resources: Resource[]): BookedTimeSlot {
    return {
        ...slot,
        resources,
    };
}

export interface BookableTimes {
    date: IsoDate;
    bookableTimes: ExactTimeAvailability[];
}

export interface ResourceDayAvailability {
    resource: Resource
    availability: DayAndTimePeriod[]
}

export function resourceDayAvailability(resource: Resource, availability: DayAndTimePeriod[]): ResourceDayAvailability {
    return {
        resource,
        availability,
    };
}


export function bookableTimeSlots(date: IsoDate, bookableSlots: TimeslotSpec[]): BookableTimeSlots {
    return {
        date,
        bookableSlots,
    };
}

function listDays(fromDate: IsoDate, toDate: IsoDate) {
    const from = new Date(fromDate.value);
    const to = new Date(toDate.value);
    const dates: IsoDate[] = [];
    for (let date = from; date <= to; date.setDate(date.getDate() + 1)) {
        dates.push(isoDate(date.toISOString().split('T')[0]));
    }
    return dates;
}

function hasResourcesForSlot(date: IsoDate, slot: BookableSlot, service: Service, bookingWithResourceUsage: BookingWithResourceUsage[], availableResources: ResourceDayAvailability[]): boolean {
    const slotDayAndTime = dayAndTimePeriod(date, calcSlotPeriod(slot, service.duration))
    const resourcesUsedDuringSlot = bookingWithResourceUsage
        .filter(r => dayAndTimePeriodFns.overlaps(calcBookingPeriod(r.booking, service.duration), slotDayAndTime))
        .flatMap(r => r.resources);
    const availableResourcesForSlot = availableResources.filter(ra => ra.availability.some(da => dayAndTimePeriodFns.overlaps(da, slotDayAndTime)));
    const resourcesTypesAvailable = availableResourcesForSlot
        .map(a => a.resource)
        .filter(r => !resourcesUsedDuringSlot.find(used => values.isEqual(used.id, r.id)))
        .map(r => r.type);
    return service.resourceTypes.every(rt => resourcesTypesAvailable.find(rta => values.isEqual(rta, rt)));
}

function hasResourcesForSlot2(date: IsoDate, slot: BookableSlot, service: Service, availableResources: ResourceDayAvailability[]): boolean {
    const slotDayAndTime = dayAndTimePeriod(date, calcSlotPeriod(slot, service.duration))
    const availableResourcesForSlot = availableResources.filter(ra => ra.availability.some(da => dayAndTimePeriodFns.overlaps(da, slotDayAndTime)));
    const resourcesTypesAvailable = availableResourcesForSlot
        .map(a => a.resource)
        .map(r => r.type);
    return service.resourceTypes.every(rt => resourcesTypesAvailable.find(rta => values.isEqual(rta, rt)));
}

function getResource(availabilities: ResourceDayAvailability[], resourceType: ResourceType, period: DayAndTimePeriod): Resource | null {
    const availableResources = availabilities.filter(ra => values.isEqual(ra.resource.type, resourceType));
    const availableResource = availableResources.find(ra => ra.availability.some(da => dayAndTimePeriodFns.overlaps(da, period)));
    return availableResource ? availableResource.resource : null;
}

function getAllResources(resourceTypes: ResourceType[], availabilities: ResourceDayAvailability[], period: DayAndTimePeriod): Resource[] | null {
    const resources: Resource[] = [];
    resourceTypes.forEach(rt => {
        const resource = getResource(availabilities, rt, period);
        if (resource) {
            resources.push(resource);
        } else {
            return null
        }
    })
    return resources;
}

export function calcBookingPeriod(booking: Booking, serviceDuration: number): DayAndTimePeriod {
    return dayAndTimePeriod(booking.date, calcSlotPeriod(booking.slot, serviceDuration));
}

function calcSlotPeriod(slot: BookableSlot, serviceDuration: number): TimePeriod {
    if (slot._type === 'exact.time.availability') {
        return timePeriod(slot.time, time24Fns.addMinutes(slot.time, serviceDuration));
    }
    return slot.slot;
}

interface BookingWithResourceUsage {
    booking: Booking;
    resources: Resource[]
}

interface ResourceTimeSlot {
    resourceId: ResourceId;
    allocation: DayAndTimePeriod
}


function assignResourcesToBookings(config: BusinessConfiguration, bookings: Booking[]): BookingWithResourceUsage[] {
    const resourceTimeSlots: ResourceTimeSlot[] = [];
    return bookings.map(booking => {
        const bookedService = mandatory(config.services.find(s => values.isEqual(s.id, booking.serviceId)), `Service with id ${booking.serviceId.value} not found`);
        const serviceTime = calcBookingPeriod(booking, bookedService.duration);
        const bookedResources = bookedService.resourceTypes.map((rt: ResourceType) => {
            const possibleResources = config.resourceAvailability.filter(ra => ra.availability.some(da => dayAndTimePeriodFns.overlaps(da, serviceTime))).map(a => a.resource);
            const resource = possibleResources.find(r => !resourceTimeSlots.find(rts => dayAndTimePeriodFns.overlaps(rts.allocation, serviceTime) && values.isEqual(rts.resourceId, r.id)));
            if (!resource) {
                throw new Error(`No resource of type '${rt.value}' available for booking ${booking.id.value}`);
            }
            resourceTimeSlots.push({
                resourceId: resource.id,
                allocation: serviceTime
            });
            return resource;
        })
        return {
            booking,
            resources: bookedResources,
        }
    })

}

// function applyBusinessHours(availability: BusinessAvailability, slot: BookableTimeSlots): BookableTimeSlots {
//     const availablePeriods = availability.availability.availability.filter(a => isoDateFns.isEqual(a.day, slot.date)).map(a => a.period);
//     return {
//         ...slot,
//         bookableSlots: slot.bookableSlots.filter(s => availablePeriods.find(availability => timePeriodFns.overlaps(availability, s.slot)))
//     }
// }
//
// function calculateTimeslotAvailability(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, dates: IsoDate[], resourceAvailability: ResourceDayAvailability[]): BookableTimeSlots[] {
//     const allSlotsForAllDays = dates.map(date => bookableTimeSlots(date, config.timeslots)).map(timeslot => applyBusinessHours(config.availability, timeslot));
//     const bookingsWithResources = assignResourcesToBookings(config, bookingsInDateRange);
//     return allSlotsForAllDays.map(slotsForDay => {
//         const slotsWithResources = slotsForDay.bookableSlots.filter(slot => hasResourcesForSlot(slotsForDay.date, slot, service, bookingsWithResources, config.resourceAvailability));
//         return bookableTimeSlots(slotsForDay.date, slotsWithResources)
//     })
// }


function applyBookedTimeSlotsToResourceAvailability(resourceAvailability: ResourceDayAvailability[], bookedSlot: BookedTimeSlot, service: Service): ResourceDayAvailability[] {
    return resourceAvailability.map(resource => {
        if (bookedSlot.resources.find(r => values.isEqual(r.id, resource.resource.id))) {
            return {
                ...resource,
                availability: resource.availability.flatMap(da => {
                    if (isoDateFns.sameDay(da.day, bookedSlot.date)) {
                        return dayAndTimePeriodFns.splitPeriod(da, dayAndTimePeriod(bookedSlot.date, calcSlotPeriod(bookedSlot.slot, service.duration)));
                    }
                    return [da];
                })
            }
        }
        return resource;
    })
}

function calculateTimeslotAvailability2(timeslots: TimeslotSpec[], service: Service, dates: IsoDate[], resourceAvailability: ResourceDayAvailability[]): BookedTimeSlot[] {
    let collectedSlots: BookedTimeSlot[] = [];
    dates.forEach(date => {
        const slotsForDay = timeslots.map(slot => bookableTimeSlot(date, slot));
        for (const slotForDay of slotsForDay) {
            let resourcesMayRemain = true
            while (resourcesMayRemain) {
                const resourcesForSlot = getAllResources(service.resourceTypes, resourceAvailability, dayAndTimePeriod(date, calcSlotPeriod(slotForDay.slot, service.duration)));
                if (resourcesForSlot && resourcesForSlot.length > 0) {
                    const bookedSlot = bookedTimeSlot(slotForDay, resourcesForSlot);
                    collectedSlots.push(bookedSlot);
                    resourceAvailability = applyBookedTimeSlotsToResourceAvailability(resourceAvailability, bookedSlot, service);
                } else {
                    resourcesMayRemain = false;
                }
            }
        }
    })
    return collectedSlots
}

function calculatePeriodicStartTimes(): ExactTimeAvailability[] {
    return []
}

function calculateDiscreteStartTimes(discreteStartTimes: DiscreteStartTimes, config: BusinessConfiguration, date: IsoDate, bookingsWithResources: BookingWithResourceUsage[], service: Service): ExactTimeAvailability[] {
    const availableTimes = discreteStartTimes.times.filter(time => hasResourcesForSlot(date, exactTimeAvailability(time), service, bookingsWithResources, config.resourceAvailability));
    return availableTimes.map(time => exactTimeAvailability(time));
}

function calculateExactTimeAvailabilityForDate(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, date: IsoDate): BookableTimes {
    const bookingsWithResources = assignResourcesToBookings(config, bookingsInDateRange);
    const availableTimes = config.startTimeSpec._type === 'periodic.start.time' ? calculatePeriodicStartTimes() : calculateDiscreteStartTimes(config.startTimeSpec, config, date, bookingsWithResources, service);
    return {
        date,
        bookableTimes: availableTimes
    };

}

function calculateExactTimeAvailability(config: BusinessConfiguration, bookingsInDateRange: Booking[], service: Service, dates: IsoDate[]): BookableTimes[] {
    return dates.map(date => calculateExactTimeAvailabilityForDate(config, bookingsInDateRange, service, date));
}

function toBookableTimeSlots(dates: IsoDate[], slots: BookableTimeSlot[]): BookableTimeSlots[] {
    return dates.map(date => {
        return {
            date,
            bookableSlots: slots.filter(slot => isoDateFns.isEqual(slot.date, date)).map(slot => slot.slot)
        }
    })
}

export function calculateAvailability(config: BusinessConfiguration, bookings: Booking[], serviceId: ServiceId, fromDate: IsoDate, toDate: IsoDate): BookedTimeSlot[] | BookableTimes[] {
    const service = mandatory(config.services.find(s => s.id.value === serviceId.value), `Service with id ${serviceId.value} not found`);
    const bookingsInDateRange = bookings.filter(b => b.date >= fromDate && b.date <= toDate);
    const dates = listDays(fromDate, toDate);
    const actualResourceAvailability = fitAvailability(applyBookingsToResourceAvailability(config.resourceAvailability, bookingsInDateRange, config.services), config.availability.availability);
    if (service.requiresTimeslot) {
        return calculateTimeslotAvailability2(config.timeslots, service, dates, actualResourceAvailability);
    }
    return calculateExactTimeAvailability(config, bookingsInDateRange, service, dates);
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
        return isoDateFns.sameDay(period1, period2) && timePeriodFns.intersects(period1.period, period2.period);
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

