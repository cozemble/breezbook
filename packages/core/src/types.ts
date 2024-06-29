import {v4 as uuidv4, v4 as uuid} from 'uuid';
import dayjs from 'dayjs';
import {ToWords} from "to-words";
import {StartTime} from "./availability.js";
import {errorResponse, ErrorResponse, errorResponseFns, mandatory, success, Success} from "./utils.js";

export interface ValueType<T> {
    _type: unknown;
    value: T;
}

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
    }
}

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

export interface TenantSettings {
    _type: 'tenant.settings';
    customerFormId: FormId | null;
    timezone: Timezone;
}

export function tenantSettings(timezone: Timezone, customerFormId: FormId | null): TenantSettings {
    return {
        _type: 'tenant.settings',
        timezone,
        customerFormId
    };
}

export interface IsoDate extends ValueType<string> {
    _type: 'iso.date';
}

export function isoDate(value: string = dayjs().format('YYYY-MM-DD')): IsoDate {
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
            dates.push(isoDate(dayjs(currentDate).format('YYYY-MM-DD')));
            currentDate = dayjs(currentDate).add(1, 'day').toDate();
        }
        return dates;
    },
    addDays(date: IsoDate, days: number) {
        return isoDate(dayjs(date.value).add(days, 'day').format('YYYY-MM-DD'));
    },
    dayOfWeek(date: IsoDate) {
        return new Date(date.value).toLocaleDateString('en-GB', {weekday: 'long'}) as DayOfWeek;
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
        return dates.reduce((max, date) => (this.gte(date, max) ? date : max), mandatory(dates[0], `No dates to compare`))
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
    next(dayOfWeek: DayOfWeek): IsoDate {
        const twoWeeks = [...daysOfWeek, ...daysOfWeek];
        const todayIndex = twoWeeks.indexOf(this.dayOfWeek(isoDate()));
        const dayIndex = twoWeeks.indexOf(dayOfWeek, todayIndex);
        const daysToAdd = dayIndex - todayIndex;
        return this.addDays(isoDate(), daysToAdd);
    },
    daysUntil(other: IsoDate): number {
        const today = dayjs(isoDate().value);
        const otherDate = dayjs(other.value);
        return otherDate.diff(today, 'days');
    }
};

export interface ServiceId extends ValueType<string> {
    _type: 'service.id';
}

export interface CustomerId extends ValueType<string> {
    _type: 'customer.id';
}

export function customerId(value: string = uuidv4()): CustomerId {
    return {
        _type: 'customer.id',
        value
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
        timezone
    };
}

export interface Duration extends ValueType<Minutes> {
    _type: 'duration';
}

export function duration(value: Minutes): Duration {
    return {
        _type: 'duration',
        value
    };
}

export const time24Fns = {
    addMinutes: (time: TwentyFourHourClockTime, addition: Minutes): TwentyFourHourClockTime => {
        const minutes = addition.value;
        const [hours, mins] = time.value.split(':').map((s) => parseInt(s, 10));
        if (hours === undefined || mins === undefined || isNaN(hours) || isNaN(minutes)) {
            throw new Error(`Invalid time format ${time.value}. Expected HH:MM`);
        }
        const newMins = mins + minutes;
        const newHours = hours + Math.floor(newMins / 60);
        const newMinsMod60 = newMins % 60;

        const paddedHours = newHours.toString().padStart(2, '0');
        const paddedMins = (newMinsMod60 < 10 ? '0' : '') + newMinsMod60;

        return time24(`${paddedHours}:${paddedMins}`, time.timezone);
    },
    toWords(time: TwentyFourHourClockTime): string {
        const [hours, minutes] = time.value.split(':').map((s) => parseInt(s, 10));
        if (hours === undefined || minutes === undefined || isNaN(hours) || isNaN(minutes)) {
            throw new Error(`Invalid time format ${time.value}. Expected HH:MM`);
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
    }
};

export function resourceType(value: string): ResourceType {
    return {
        _type: 'resource.type',
        value,
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
}

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

export const makeId = id

export interface TimeslotSpec {
    _type: 'timeslot.spec';
    id: Id;
    slot: TimePeriod;
    description: string;
}

export function timeslotSpec(from: TwentyFourHourClockTime, to: TwentyFourHourClockTime, description: string, idValue = id(uuidv4())): TimeslotSpec {
    return {
        _type: 'timeslot.spec',
        id: idValue,
        description,
        slot: timePeriod(from, to)
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
        timezone
    };
}

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

export interface Customer {
    id: CustomerId;
    firstName: string;
    lastName: string;
    email: Email;
    phone: PhoneNumber;
    formData: unknown;
}

export function customer(firstName: string, lastName: string, emailStr: string, phoneStr: string, formData: unknown = null, id = customerId(uuidv4())): Customer {
    return {
        id,
        firstName,
        lastName,
        email: email(emailStr),
        phone: phoneNumber(phoneStr),
        formData
    };
}

export type BookableSlot = ExactTimeAvailability | TimeslotSpec;

export interface FixedResourceAllocation {
    _type: 'fixed.resource.allocation';
    requirementId: ResourceRequirementId;
    resourceId: ResourceId;
}

export function fixedResourceAllocation(requirementId: ResourceRequirementId, resourceId: ResourceId): FixedResourceAllocation {
    return {
        _type: 'fixed.resource.allocation',
        requirementId,
        resourceId
    };
}

export interface Booking {
    id: BookingId;
    customerId: CustomerId;
    date: IsoDate;
    period: TimePeriod;
    service: Service;
    bookedCapacity: Capacity;
    status: 'confirmed' | 'cancelled';
    fixedResourceAllocation: FixedResourceAllocation[]
    formData?: unknown;
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

export function booking(
    customerId: CustomerId,
    service: Service,
    date: IsoDate,
    period: TimePeriod,
    bookedCapacity = capacity(1),
    fixedResourceAllocation: FixedResourceAllocation[] = [],
    id = bookingId(uuidv4())
): Booking {
    return {
        id,
        customerId,
        date,
        period,
        status: "confirmed",
        service,
        bookedCapacity,
        fixedResourceAllocation
    };
}

export const bookingFns = {
    calcPeriod(booking: Booking): DayAndTimePeriod {
        return dayAndTimePeriod(booking.date, booking.period);
    },
    cancel(booking: Booking): Booking {
        return {
            ...booking,
            status: 'cancelled'
        };
    }
}

export interface MoneyInMinorUnits extends ValueType<number> {
    _type: 'money.in.minor.units';
}

export function moneyInMinorUnits(value: number): MoneyInMinorUnits {
    return {
        _type: 'money.in.minor.units',
        value
    };
}

export interface Currency extends ValueType<string> {
    _type: 'currency';
}

export const currencies = {
    NULL: currency('NULL'),
    GBP: currency('GBP'),
    USD: currency('USD'),
    EUR: currency('EUR'),
    AUD: currency('AUD'),
    CAD: currency('CAD'),
    JPY: currency('JPY'),
    NZD: currency('NZD'),
    CHF: currency('CHF')
};

export const currencyFns = {
    name: function (currency: Currency): string {
        switch (currency.value) {
            case 'GBP':
                return 'Pound';
            case 'USD':
                return 'Dollar';
            case 'EUR':
                return 'Euro';
            case 'AUD':
                return 'Dollar';
            case 'CAD':
                return 'Dollar';
            case 'JPY':
                return 'Yen';
            case 'NZD':
                return 'Dollar';
            case 'CHF':
                return 'Franc';
            default:
                return currency.value;
        }
    },
    plural: function (currency: Currency): string {
        switch (currency.value) {
            case 'GBP':
                return 'Pounds';
            case 'USD':
                return 'Dollars';
            case 'EUR':
                return 'Euros';
            case 'AUD':
                return 'Dollars';
            case 'CAD':
                return 'Dollars';
            case 'JPY':
                return 'Yen';
            case 'NZD':
                return 'Dollars';
            case 'CHF':
                return 'Francs';
            default:
                return currency.value;
        }
    },
    fractionalName: function (currency: Currency): string {
        switch (currency.value) {
            case 'GBP':
                return 'Penny';
            case 'USD':
                return 'Cent';
            case 'EUR':
                return 'Cent';
            case 'AUD':
                return 'Cent';
            case 'CAD':
                return 'Cent';
            case 'JPY':
                return 'Yen';
            case 'NZD':
                return 'Cent';
            case 'CHF':
                return 'Rappen';
            default:
                return currency.value;
        }
    },
    fractionalPlural: function (currency: Currency): string {
        switch (currency.value) {
            case 'GBP':
                return 'Pence';
            case 'USD':
                return 'Cents';
            case 'EUR':
                return 'Cents';
            case 'AUD':
                return 'Cents';
            case 'CAD':
                return 'Cents';
            case 'JPY':
                return 'Yen';
            case 'NZD':
                return 'Cents';
            case 'CHF':
                return 'Rappen';
            default:
                return currency.value;
        }

    },
    symbol: function (currency: Currency): string {
        switch (currency.value) {
            case 'GBP':
                return '£';
            case 'USD':
                return '$';
            case 'EUR':
                return '€';
            case 'AUD':
                return '$';
            case 'CAD':
                return '$';
            case 'JPY':
                return '¥';
            case 'NZD':
                return '$';
            case 'CHF':
                return 'CHF';
            default:
                return currency.value;
        }
    },
    fractionalSymbol: function (currency: Currency): string {
        switch (currency.value) {
            case 'GBP':
                return 'p';
            case 'USD':
                return '¢';
            case 'EUR':
                return 'c';
            case 'AUD':
                return 'c';
            case 'CAD':
                return 'c';
            case 'JPY':
                return '¥';
            case 'NZD':
                return 'c';
            case 'CHF':
                return 'Rp';
            default:
                return currency.value;
        }
    }
}

export interface Price {
    _type: 'price';
    amount: MoneyInMinorUnits;
    currency: Currency;
}

export const priceFns = {
    add(...prices: Price[]): Price {
        const currencies = prices.map((p) => p.currency.value);
        if (currencies.some((c) => c !== currencies[0])) {
            throw new Error(`Cannot add prices with different currencies: ${currencies.join(', ')}`);
        }
        return prices.reduce((total, aPrice) => price(total.amount.value + aPrice.amount.value, total.currency), price(0, mandatory(prices[0], `Must have at least one price`).currency));
    },
    multiply(thePrice: Price, quantity: number) {
        return price(thePrice.amount.value * quantity, thePrice.currency);
    },
    subtract(price1: Price, price2: Price) {
        if (price1.currency.value !== price2.currency.value) {
            throw new Error(`Cannot substract prices with different currencies: ${price1.currency.value} and ${price2.currency.value}`);
        }
        return price(price1.amount.value - price2.amount.value, price1.currency);
    },
    isEqual(price1: Price, price2: Price) {
        return price1.amount.value === price2.amount.value && price1.currency.value === price2.currency.value;
    },
    toWords(price: Price): string {
        const toWords = new ToWords();
        const amount = price.amount.value / 100;
        return toWords.convert(amount, {
            currency: true,
            doNotAddOnly: true,
            currencyOptions: {
                name: currencyFns.name(price.currency),
                plural: currencyFns.plural(price.currency),
                symbol: currencyFns.symbol(price.currency),
                fractionalUnit: {
                    name: currencyFns.fractionalName(price.currency),
                    plural: currencyFns.fractionalPlural(price.currency),
                    symbol: currencyFns.fractionalSymbol(price.currency)
                }
            }
        });
    },
    sum(prices: Price[]): Price {
        if (prices.length === 0) {
            throw new Error('Cannot sum an empty list of prices');
        }
        return prices.reduce((acc, price) => priceFns.add(acc, price), price(0, prices[0].currency));
    },
    format(price: Price, roundToMajor = true): string {
        const initial = `${(price.amount.value / 100).toFixed(2)}`;
        if (roundToMajor && initial.endsWith('.00')) {
            return initial.slice(0, -3);
        }
        return initial;
    }
};

export function currency(value: string): Currency {
    return {
        _type: 'currency',
        value
    };
}

export const GBP = currency('GBP');

export function price(amountInMinorUnits: number, currency: Currency): Price {
    if (parseInt(amountInMinorUnits.toString()) !== amountInMinorUnits) {
        throw new Error(`Amount in minor units must be an integer. Got ${amountInMinorUnits}`)
    }
    return {
        _type: 'price',
        amount: moneyInMinorUnits(amountInMinorUnits),
        currency
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

export interface AnySuitableResource {
    _type: 'any.suitable.resource'
    id: ResourceRequirementId
    requirement: ResourceType
}

export interface SpecificResource {
    _type: 'specific.resource'
    id: ResourceRequirementId
    resource: Resource
}

export function anySuitableResource(requirement: ResourceType, id = resourceRequirementId()): AnySuitableResource {
    return {
        _type: 'any.suitable.resource',
        requirement,
        id
    }
}

export function specificResource(resource: Resource, id = resourceRequirementId()): SpecificResource {
    return {
        _type: 'specific.resource',
        resource,
        id
    }
}

export type ResourceRequirement = AnySuitableResource | SpecificResource

export interface RequirementMatch {
    requirement: ResourceRequirement
    match: ResourceDayAvailability
}

export function requirementMatch(requirement: ResourceRequirement, match: ResourceDayAvailability): RequirementMatch {
    return {
        requirement,
        match
    }
}

function getAvailableResources(fixedResourceAllocation: FixedResourceAllocation[], requirement: AnySuitableResource | SpecificResource, available: ResourceDayAvailability[]): ResourceDayAvailability[] {
    const maybeOverride = fixedResourceAllocation.find(fra => fra.requirementId.value === requirement.id.value);
    if (maybeOverride) {
        return available.filter(ra => ra.resource.id.value === maybeOverride.resourceId.value);
    }
    return requirement._type === 'any.suitable.resource' ? available.filter(ra => ra.resource.type.value === requirement.requirement.value) : available.filter(ra => ra.resource.id.value === requirement.resource.id.value);
}

export const resourceRequirementFns = {
    errorCodes: {
        noSuitableResource: 'no.suitable.resource',
        repeatedResourceAndRole: 'repeated.resource.and.role',
    },
    matchRequirements: (available: ResourceDayAvailability[], period: DayAndTimePeriod, requirements: ResourceRequirement[], fixedResourceAllocation: FixedResourceAllocation[]): Success<RequirementMatch[]> | ErrorResponse<ResourceRequirement> => {
        const matched: RequirementMatch[] = [];
        for (const requirement of requirements) {
            const availableResources = getAvailableResources(fixedResourceAllocation, requirement, available);
            const possibleResources = availableResources.filter(ra => ra.availability.some(da => dayAndTimePeriodFns.overlaps(da.when, period)));
            if (possibleResources.length > 0) {
                const availableResource = possibleResources.find(r => !matched.some(m => m.match.resource.id === r.resource.id))
                if (availableResource) {
                    matched.push({requirement, match: availableResource});
                } else {
                    return errorResponse(resourceRequirementFns.errorCodes.noSuitableResource, `No suitable resource found for requirement id '${requirement.id.value}' - it's already booked`, requirement);
                }
            } else {
                return errorResponse(resourceRequirementFns.errorCodes.noSuitableResource, `No suitable resource found for requirement id '${requirement.id.value}'`, requirement);
            }
        }
        return success(matched)
    },
    equals(a: ResourceRequirement, b: ResourceRequirement): boolean {
        if (a._type === 'any.suitable.resource' && b._type === 'any.suitable.resource') {
            return a.requirement.value === b.requirement.value && a.id?.value === b.id?.value;
        }
        if (a._type === 'specific.resource' && b._type === 'specific.resource') {
            return values.isEqual(a.resource.id, b.resource.id) && a.id?.value === b.id?.value;
        }
        return false;
    },
    sameRequirement(a: ResourceRequirement, b: ResourceRequirement): boolean {
        if (a._type === 'any.suitable.resource' && b._type === 'any.suitable.resource') {
            return a.requirement.value === b.requirement.value;
        }
        if (a._type === 'specific.resource' && b._type === 'specific.resource') {
            return values.isEqual(a.resource.id, b.resource.id);
        }
        return false;
    },
    validateRequirements(resourceRequirements: ResourceRequirement[]): ErrorResponse | null {
        const resourcesAndRoles = resourceRequirements.map(r => {
            if (r._type === 'any.suitable.resource') {
                return {key: r.requirement, role: r.id}
            }
            return {key: r.resource.id, role: r.id}
        })
        const firstDuplicate = resourcesAndRoles.find((r, i) => resourcesAndRoles.slice(i + 1).find(rr => values.isEqual(r.key, rr.key) && r.role?.value === rr.role?.value))
        if (firstDuplicate) {
            return errorResponse(resourceRequirementFns.errorCodes.repeatedResourceAndRole, `Duplicate resource requirement found for ${JSON.stringify(firstDuplicate)}`)
        }
        return null
    }
}

export interface Service {
    id: ServiceId;
    name: string;
    description: string;
    duration: Minutes;
    resourceRequirements: ResourceRequirement[]
    price: Price;
    permittedAddOns: AddOnId[];
    serviceFormIds: FormId[];
    options: ServiceOption[];
    startTimes: StartTime[] | null;
    capacity: Capacity;
}

export interface ServiceOptionId extends ValueType<string> {
    _type: 'service.option.id';
}

export function serviceOptionId(value: string): ServiceOptionId {
    return {
        _type: 'service.option.id',
        value
    };
}

export interface ServiceOption {
    _type: 'service.option';
    id: ServiceOptionId;
    name: string;
    description: string;
    price: Price;
    requiresQuantity: boolean;
    duration: Duration;
    resourceRequirements: ResourceRequirement[];
    forms: FormId[]
}

export const serviceFns = {
    addOptions(service: Service, serviceOptions: ServiceOption[]): Service {
        return {
            ...service,
            options: service.options.concat(serviceOptions)
        };
    },
    setStartTimes(service: Service, startTimes: StartTime[] | null): Service {
        return {
            ...service,
            startTimes
        }
    },
    findService(services: Service[], serviceId: ServiceId): Service {
        const found = services.find(s => values.isEqual(s.id, serviceId));
        if (!found) {
            throw new Error(`No service found with id ${serviceId.value}`);
        }
        return found;

    },
    maybeFindService(services: Service[], serviceId: ServiceId): Service | null {
        return services.find(s => values.isEqual(s.id, serviceId)) ?? null;
    },
    replaceRequirement(theService: Service, existing: ResourceRequirement, replacement: ResourceRequirement): Service {
        return {
            ...theService,
            resourceRequirements: theService.resourceRequirements.map(r => resourceRequirementFns.equals(r, existing) ? replacement : r)
        }
    }
}

export function service(
    name: string,
    description: string,
    resourceRequirements: ResourceRequirement[],
    duration: Minutes,
    price: Price,
    permittedAddOns: AddOnId[],
    serviceFormIds: FormId[],
    theCapacity = capacity(1),
    id = serviceId(uuidv4())
): Service {
    const requirementError = resourceRequirementFns.validateRequirements(resourceRequirements);
    if (requirementError) {
        throw errorResponseFns.toError(requirementError)
    }
    return {
        id,
        name,
        description,
        duration,
        resourceRequirements,
        price,
        permittedAddOns,
        serviceFormIds,
        capacity: theCapacity,
        options: [],
        startTimes: null
    };
}

export function serviceOption(
    name: string,
    description: string,
    price: Price,
    requiresQuantity: boolean,
    duration: Duration,
    resourceRequirements: ResourceRequirement[],
    forms: FormId[],
    id = serviceOptionId(uuidv4())
): ServiceOption {
    return {
        _type: 'service.option',
        id,
        name,
        description,
        price,
        requiresQuantity,
        duration,
        resourceRequirements,
        forms
    };
}

export type Metadata = Record<string, string | number | boolean>

export interface Resource {
    _type: 'resource';
    id: ResourceId;
    type: ResourceType;
    name: string;
    metadata?: Metadata;
}

export function resourceId(value= uuidv4()): ResourceId {
    return {
        _type: 'resource.id',
        value
    };
}

export function resource(type: ResourceType, name: string, metadata: Metadata = {}, id = resourceId(uuidv4())): Resource {
    return {
        _type: 'resource',
        id,
        type,
        name,
        metadata
    };
}

export const resourceFns = {
    findById(resources: Resource[], resourceId: ResourceId): Resource {
        const found = resources.find(r => values.isEqual(r.id, resourceId));
        if (!found) {
            throw new Error(`No resource found with id ${resourceId.value}`);
        }
        return found;
    }
}

export interface BusinessConfiguration {
    _type: 'business.configuration';
    availability: BusinessAvailability;
    resourceAvailability: ResourceDayAvailability[];
    resources: Resource[];
    services: Service[];
    addOns: AddOn[];
    timeslots: TimeslotSpec[];
    forms: Form[];
    startTimeSpec: StartTimeSpec;
    customerFormId: FormId | null;
}

export interface PeriodicStartTime {
    _type: 'periodic.start.time';
    period: Duration;
}

export function periodicStartTime(period: Duration): PeriodicStartTime {
    return {
        _type: 'periodic.start.time',
        period
    };
}

export interface DiscreteStartTimes {
    _type: 'discrete.start.times';
    times: TwentyFourHourClockTime[];
}

export function discreteStartTimes(times: TwentyFourHourClockTime[]): DiscreteStartTimes {
    return {
        _type: 'discrete.start.times',
        times
    };
}

export type StartTimeSpec = PeriodicStartTime | DiscreteStartTimes;

export interface AddOnId extends ValueType<string> {
    _type: 'add.on.id';
}

export function addOnId(value: string): AddOnId {
    return {
        _type: 'add.on.id',
        value
    };
}

export interface AddOn {
    _type: 'add.on';
    id: AddOnId;
    name: string;
    description: string | null;
    price: Price;
    requiresQuantity: boolean;
}

export function addOn(name: string, price: Price, requiresQuantity: boolean, description: string | null, id = addOnId(uuidv4())): AddOn {
    return {
        _type: 'add.on',
        id,
        name,
        price,
        requiresQuantity,
        description
    };
}

export const addOnFns = {
    findById(addOns: AddOn[], addOnId: AddOnId): AddOn {
        const found = addOns.find(a => values.isEqual(a.id, addOnId));
        if (!found) {
            throw new Error(`No add-on found with id ${addOnId.value}`);
        }
        return found;
    }
}

export function businessConfiguration(
    availability: BusinessAvailability,
    resources: Resource[],
    resourceAvailability: ResourceDayAvailability[],
    services: Service[],
    addOns: AddOn[],
    timeslots: TimeslotSpec[],
    forms: Form[],
    startTimeSpec: StartTimeSpec,
    customerFormId: FormId | null
): BusinessConfiguration {
    return {
        _type: 'business.configuration',
        availability,
        resources,
        resourceAvailability,
        services,
        timeslots,
        startTimeSpec,
        addOns,
        forms,
        customerFormId
    };
}

export interface AvailabilityBlock {
    _type: 'availability.block';
    when: DayAndTimePeriod;
}

export const availabilityBlockFns = {
    dropAvailability(when: DayAndTimePeriod, block: AvailabilityBlock): AvailabilityBlock[] {
        if (dayAndTimePeriodFns.intersects(block.when, when)) {
            const split = dayAndTimePeriodFns.splitPeriod(block.when, when)
            return split.map(dt => availabilityBlock(dt))
        }
        return [block];
    }
}

export function availabilityBlock(when: DayAndTimePeriod): AvailabilityBlock {
    return {
        _type: 'availability.block',
        when,
    };
}

export interface ResourceDayAvailability {
    resource: Resource;
    availability: AvailabilityBlock[];
}

export function resourceDayAvailability(resource: Resource, availability: AvailabilityBlock[]): ResourceDayAvailability {
    return {
        resource,
        availability
    };
}

export const resourceDayAvailabilityFns = {
    reduceToResource: (resourceDayAvailabilities: ResourceDayAvailability[], resourceId: ResourceId): ResourceDayAvailability[] => {
        return resourceDayAvailabilities.filter((rda) => rda.resource.id.value === resourceId.value);
    },
    dropAvailability(when: DayAndTimePeriod, resource: Resource, acc: ResourceDayAvailability[]): ResourceDayAvailability[] {
        return acc.map(rda => {
            if (rda.resource.id.value === resource.id.value) {
                return {
                    ...rda,
                    availability: rda.availability.flatMap(block => availabilityBlockFns.dropAvailability(when, block))
                }
            }
            return rda
        });
    }
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
            remainingTimePeriods.push(bookingPeriod.period)
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
    listPossibleStartTimes(period: TimePeriod, duration: Duration): TwentyFourHourClockTime[] {
        let currentTime = period.from;
        const result: TwentyFourHourClockTime[] = []
        while (currentTime.value < period.to.value) {
            result.push(currentTime);
            currentTime = time24Fns.addMinutes(currentTime, duration.value)
        }
        return result
    },
    equals(period: TimePeriod, period2: TimePeriod) {
        return period.from.value === period2.from.value && period.to.value === period2.to.value;
    },
    sequential(period: TimePeriod, period2: TimePeriod) {
        return period.to.value === period2.from.value;
    },
    calcPeriod(from: TwentyFourHourClockTime, duration: Duration | Minutes): TimePeriod {
        const durationMinutes = duration._type === 'duration' ? duration.value : duration;
        return timePeriod(from, time24Fns.addMinutes(from, durationMinutes));
    }
};

export interface FormId extends ValueType<string> {
    _type: 'form.id';
}

export function formId(value: string): FormId {
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

export type Form = JsonSchemaForm;

export interface AddOnOrder {
    addOnId: AddOnId;
    quantity: number;
}

export function addOnOrder(addOnId: AddOnId, quantity = 1): AddOnOrder {
    return {
        addOnId,
        quantity
    };
}

export interface OrderLine {
    _type: 'order.line';
    serviceId: ServiceId;
    locationId: LocationId
    servicePrice: number;
    servicePriceCurrency: string;
    addOns: AddOnOrder[];
    date: IsoDate;
    slot: BookableSlot;
    serviceFormData: unknown[];
}

export interface LimitedUsages {
    _type: 'limited.usages';
    numberOfUses: number;
}

export interface Unlimited {
    _type: 'unlimited';
}

export function unlimited(): Unlimited {
    return {
        _type: 'unlimited'
    };
}

export type CouponUsagePolicy = LimitedUsages | Unlimited;

export type CouponValue = AmountCoupon | PercentageCoupon;

export interface CouponCode extends ValueType<string> {
    _type: 'coupon.code';
}

export function couponCode(value: string): CouponCode {
    return {
        _type: 'coupon.code',
        value
    };
}

export interface Coupon {
    _type: 'coupon';
    id: CouponId;
    code: CouponCode;
    usagePolicy: CouponUsagePolicy;
    value: CouponValue;
    validFrom: IsoDate;
    validTo?: IsoDate;
}

export function coupon(
    code: CouponCode,
    usagePolicy: CouponUsagePolicy,
    value: CouponValue,
    validFrom: IsoDate,
    validTo?: IsoDate,
    id: CouponId = couponId(uuidv4())
): Coupon {
    return {
        _type: 'coupon',
        id,
        code,
        usagePolicy,
        value,
        validFrom,
        validTo
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

export interface AmountCoupon {
    _type: 'amount.coupon';
    amount: Price;
}

export interface PercentageAsRatio extends ValueType<number> {
    _type: 'percentage.as.ratio';
}

export function percentageAsRatio(value: number): PercentageAsRatio {
    if (value < 0 || value > 1) {
        throw new Error(`Percentage as ratio must be between 0 and 1. Got ${value}`);
    }
    return {
        _type: 'percentage.as.ratio',
        value
    };
}

export interface PercentageCoupon {
    _type: 'percentage.coupon';
    percentage: PercentageAsRatio;
}

export function amountCoupon(amount: Price): AmountCoupon {
    return {
        _type: 'amount.coupon',
        amount
    };
}

export function percentageCoupon(percentage: PercentageAsRatio): PercentageCoupon {
    return {
        _type: 'percentage.coupon',
        percentage
    };
}

export function orderLine(
    serviceId: ServiceId,
    locationId: LocationId,
    servicePrice: Price,
    addOns: AddOnOrder[],
    date: IsoDate,
    slot: BookableSlot,
    serviceFormData: unknown[]
): OrderLine {
    return {
        _type: 'order.line',
        serviceId,
        locationId,
        servicePrice: servicePrice.amount.value,
        servicePriceCurrency: servicePrice.currency.value,
        addOns,
        date,
        slot,
        serviceFormData
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

export interface Order {
    _type: 'order';
    id: OrderId;
    customer: Customer;
    lines: OrderLine[];
    couponCode?: CouponCode;
}

export function order(customer: Customer, lines: OrderLine[], id = orderId(uuidv4())): Order {
    return {
        _type: 'order',
        id,
        customer,
        lines
    };
}

export const orderFns = {
    getOrderDateRange(order: Order): { fromDate: IsoDate; toDate: IsoDate } {
        const allDates = order.lines.map((line) => line.date);
        const fromDate = isoDateFns.min(...allDates);
        const toDate = isoDateFns.max(...allDates);
        return {fromDate, toDate};
    },
    addCoupon(order: Order, couponCode: CouponCode): Order {
        return {
            ...order,
            couponCode
        };
    }
};

export interface BlockedTime {
    _type: 'blocked.time';
    id: Id;
    date: IsoDate;
    start_time_24hr: TwentyFourHourClockTime;
    end_time_24hr: TwentyFourHourClockTime;
}

export function blockedTime(date: IsoDate,
                            start_time_24hr: TwentyFourHourClockTime,
                            end_time_24hr: TwentyFourHourClockTime, id = makeId()): BlockedTime {
    return {
        _type: 'blocked.time',
        date, start_time_24hr, end_time_24hr, id
    }
}

export interface BusinessHours {
    _type: 'business.hours';
    id: Id;
    day_of_week: DayOfWeek;
    start_time_24hr: TwentyFourHourClockTime;
    end_time_24hr: TwentyFourHourClockTime;
}

export function businessHours(day_of_week: DayOfWeek,
                              start_time_24hr: TwentyFourHourClockTime,
                              end_time_24hr: TwentyFourHourClockTime): BusinessHours {
    return {
        _type: 'business.hours',
        id: id(),
        day_of_week,
        start_time_24hr,
        end_time_24hr
    };
}

export interface DaysFromTimeSpec {
    _type: 'days.from.time.spec';
    relativeTo: 'today';
    days: number;
}

export function daysFromToday(days: number): DaysFromTimeSpec {
    return {
        _type: 'days.from.time.spec',
        relativeTo: 'today',
        days
    };
}

export type TimeSpec = DaysFromTimeSpec;


export interface AddOnWithTotal {
    _type: 'add.on.with.total';
    addOn: AddOn;
    quantity: number;
    addOnTotal: Price;
}

export function addOnWithTotal(addOn: AddOn, quantity: number): AddOnWithTotal {
    return {
        _type: 'add.on.with.total',
        addOn,
        quantity,
        addOnTotal: priceFns.multiply(addOn.price, quantity)
    };
}

export interface OrderLineWithTotal {
    _type: 'order.line.with.total';
    serviceId: ServiceId;
    addOn: AddOnWithTotal[];
    lineTotal: Price;
}

export function orderLineWithTotal(serviceId: ServiceId, servicePrice: Price, addOns: AddOnWithTotal[]): OrderLineWithTotal {
    const lineTotal = priceFns.add(
        servicePrice,
        addOns.reduce((total, addOn) => priceFns.add(total, addOn.addOnTotal), price(0, servicePrice.currency))
    );
    return {
        _type: 'order.line.with.total',
        serviceId: serviceId,
        addOn: addOns,
        lineTotal
    };
}

export interface OrderWithTotal {
    _type: 'order.with.total';
    order: Order;
    lineTotals: OrderLineWithTotal[];
    couponDiscount?: Price;
    orderTotal: Price;
}

export function orderWithTotal(order: Order, lineTotals: OrderLineWithTotal[], couponDiscount?: Price): OrderWithTotal {
    return {
        _type: 'order.with.total',
        order,
        lineTotals,
        couponDiscount,
        orderTotal:
            lineTotals.length === 0
                ? price(0, currency('N/A'))
                : lineTotals.reduce((total, line) => priceFns.add(total, line.lineTotal), price(0, lineTotals[0].lineTotal.currency))
    };
}

export interface FullPaymentOnCheckout {
    _type: 'full.payment.on.checkout';
}

export function fullPaymentOnCheckout(): FullPaymentOnCheckout {
    return {
        _type: 'full.payment.on.checkout'
    };
}

export interface DepositAndBalance {
    _type: 'deposit.and.balance';
    depositAmount: Price;
}

export interface PaymentOnServiceDelivery {
    _type: 'payment.on.service.delivery';
}

export type PaymentIntent = FullPaymentOnCheckout | DepositAndBalance | PaymentOnServiceDelivery;
