import {v4 as uuidv4} from 'uuid';
import {ToWords} from "to-words";
import {StartTime} from "./availability.js";
import {mandatory} from "./utils.js";
import {
    addOnId,
    AddOnId,
    BookingId,
    bookingId,
    Capacity,
    capacity,
    CouponCode,
    couponId,
    CouponId,
    Email,
    email,
    Form,
    FormId,
    id,
    Id,
    LanguageId,
    LocationId,
    makeId,
    Minutes,
    OrderId,
    orderId,
    PhoneNumber,
    phoneNumber,
    ResourceId,
    ResourceRequirementId,
    ServiceId,
    serviceId,
    serviceOptionId,
    ServiceOptionId,
    ValueType,
} from '@breezbook/packages-types'
import {resourcing} from "@breezbook/packages-resourcing";
import {configuration} from "./configuration/configuration.js";
import {ScheduleConfig, scheduleConfigFns} from "./scheduleConfig.js";
import ResourceRequirement = resourcing.ResourceRequirement;
import Resource = resourcing.Resource;
import ResourceAvailability = configuration.ResourceAvailability;
import specificResource = resourcing.specificResource;
import {
    DayAndTimePeriod, DayOfWeek,
    Duration, IsoDate, isoDateFns,
    timePeriod,
    TimePeriod,
    timePeriodFns,
    Timezone,
    TwentyFourHourClockTime
} from '@breezbook/packages-date-time';

export interface TenantSettings {
    _type: 'tenant.settings';
    customerFormId: FormId | null;
}

export function tenantSettings(customerFormId: FormId | null): TenantSettings {
    return {
        _type: 'tenant.settings',
        customerFormId
    };
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

export const timeslotSpecFns = {

    duration(startTime: TimeslotSpec): Duration {
        return timePeriodFns.duration(startTime.slot);
    }
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
    addOns: BookedAddOn[];
    serviceOptions: BookedServiceOption[];
}

export interface BookedAddOn {
    _type: 'booked.add.on';
    addOn: AddOn;
    quantity: number;
}

export interface BookedServiceOption {
    _type: 'booked.service.option';
    serviceOption: ServiceOption;
    quantity: number;
}

export function bookedServiceOption(serviceOption: ServiceOption, quantity = 1): BookedServiceOption {
    return {
        _type: 'booked.service.option',
        serviceOption,
        quantity
    };
}

function allFixedAllocationsAreKnown(requirements: ResourceRequirement[], fixedResourceAllocation: FixedResourceAllocation[]): boolean {
    return fixedResourceAllocation.every(fra => requirements.some(r => r.id.value === fra.requirementId.value));
}

export function booking(
    customerId: CustomerId,
    service: Service,
    date: IsoDate,
    period: TimePeriod,
    addOns: BookedAddOn[] = [],
    serviceOptions: BookedServiceOption[] = [],
    bookedCapacity = capacity(1),
    fixedResourceAllocation: FixedResourceAllocation[] = [],
    id = bookingId(uuidv4())
): Booking {
    if (!allFixedAllocationsAreKnown(service.resourceRequirements, fixedResourceAllocation)) {
        throw new Error(`All fixed resource allocations must be known for service ${service.id.value}`)
    }
    return {
        id,
        customerId,
        date,
        period,
        addOns,
        serviceOptions,
        status: "confirmed",
        service,
        bookedCapacity,
        fixedResourceAllocation
    };
}

export const bookingFns = {
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


export interface Service {
    id: ServiceId;
    resourceRequirements: ResourceRequirement[]
    price: Price;
    permittedAddOns: AddOnId[];
    serviceFormIds: FormId[];
    options: ServiceOption[];
    capacity: Capacity;
    scheduleConfig: ScheduleConfig | Duration
}

export interface ConsumesServiceCapacity {
    _type: 'consumes.service.capacity';
    consumptionType: 'one-unit' | 'quantity';
}

export function consumesServiceCapacity(consumptionType: 'one-unit' | 'quantity'): ConsumesServiceCapacity {
    return {
        _type: 'consumes.service.capacity',
        consumptionType
    };
}

export type ServiceImpact = ConsumesServiceCapacity;

export interface ServiceOption {
    _type: 'service.option';
    id: ServiceOptionId;
    price: Price;
    requiresQuantity: boolean;
    duration: Duration;
    resourceRequirements: ResourceRequirement[];
    forms: FormId[]
    serviceImpacts: ServiceImpact[];
}

export interface ServiceLabels {
    name: string;
    description: string;
    serviceId: ServiceId
    languageId: LanguageId
}

export const serviceFns = {
    addOptions(service: Service, serviceOptions: ServiceOption[]): Service {
        return {
            ...service,
            options: service.options.concat(serviceOptions)
        };
    },
    findService(services: Service[], serviceId: ServiceId): Service {
        const found = services.find(s => s.id.value === serviceId.value);
        if (!found) {
            throw new Error(`No service found with id ${serviceId.value}`);
        }
        return found;

    },
    maybeFindService(services: Service[], serviceId: ServiceId): Service | null {
        return services.find(s => s.id.value === serviceId.value) ?? null;
    },
    replaceRequirement(theService: Service, existing: ResourceRequirement, replacement: ResourceRequirement): Service {
        return {
            ...theService,
            resourceRequirements: theService.resourceRequirements.map(r => r.id.value === existing.id.value ? replacement : r)
        }
    },
    duration(service: Service): Duration {
        if (service.scheduleConfig._type === 'duration') {
            return service.scheduleConfig;
        }
        return scheduleConfigFns.duration(service.scheduleConfig);
    },
    startTimes(service: Service, duration: Minutes): StartTime[] | null {
        if (service.scheduleConfig._type === 'duration') {
            return null;
        }
        return scheduleConfigFns.startTimes(service.scheduleConfig, duration);
    },
    makeRequirementSpecific(service: Service, requirementId: ResourceRequirementId, resource: Resource): Service {
        const maybeRequirement = service.resourceRequirements.find(r => r.id.value === requirementId.value);
        if (!maybeRequirement) {
            throw new Error(`No resource requirement found with id ${requirementId.value}`);
        }
        const newResourceRequirement = specificResource(resource, requirementId);
        return {
            ...service,
            resourceRequirements: service.resourceRequirements.map(r => r.id.value === requirementId.value ? newResourceRequirement : r)
        }
    }
}

export const serviceOptionFns = {
    findServiceOption(options: ServiceOption[], serviceOptionId: ServiceOptionId): ServiceOption {
        const found = options.find(o => o.id.value === serviceOptionId.value);
        if (!found) {
            throw new Error(`No service option found with id ${serviceOptionId.value}`);
        }
        return found;
    },
    consumesServiceCapacity(serviceOption: ServiceOption): boolean {
        return serviceOption.serviceImpacts.some((impact) => impact._type === 'consumes.service.capacity');
    },
    getConsumedServiceCapacity(serviceOption: ServiceOption, quantity: number): Capacity {
        const found = serviceOption.serviceImpacts.find((impact) => impact._type === 'consumes.service.capacity');
        if (!found) {
            return capacity(0)
        }
        if (found.consumptionType === 'one-unit') {
            return capacity(1);
        }
        return capacity(quantity)
    }
}

export function service(
    resourceRequirements: ResourceRequirement[],
    price: Price,
    permittedAddOns: AddOnId[],
    serviceFormIds: FormId[],
    scheduleConfig: ScheduleConfig,
    theCapacity = capacity(1),
    id = serviceId(uuidv4())
): Service {
    return {
        id,
        resourceRequirements,
        price,
        permittedAddOns,
        serviceFormIds,
        capacity: theCapacity,
        options: [],
        scheduleConfig
    };
}

export function serviceLabels(name: string, description: string, serviceId: ServiceId, languageId: LanguageId): ServiceLabels {
    return {
        name,
        description,
        serviceId,
        languageId
    }
}

export function serviceOption(
    price: Price,
    requiresQuantity: boolean,
    duration: Duration,
    resourceRequirements: ResourceRequirement[],
    forms: FormId[],
    serviceImpacts: ServiceImpact[] = [],
    id = serviceOptionId(uuidv4())
): ServiceOption {
    return {
        _type: 'service.option',
        id,
        price,
        requiresQuantity,
        duration,
        resourceRequirements,
        forms,
        serviceImpacts
    };
}

export interface BusinessConfiguration {
    _type: 'business.configuration';
    availability: BusinessAvailability;
    resourceAvailability: ResourceAvailability[];
    resources: Resource[];
    services: Service[];
    serviceOptions: ServiceOption[];
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

export interface AddOn {
    _type: 'add.on';
    id: AddOnId;
    price: Price;
    requiresQuantity: boolean;
}

export interface AddOnLabels {
    name: string;
    description: string | null;
    addOnId: AddOnId;
    languageId: LanguageId;
}

export function addOn(price: Price, requiresQuantity: boolean, id = addOnId(uuidv4())): AddOn {
    return {
        _type: 'add.on',
        id,
        price,
        requiresQuantity,
    };
}

export function addOnLabels(name: string, description: string | null, addOnId: AddOnId, languageId: LanguageId): AddOnLabels {
    return {
        name,
        description,
        addOnId,
        languageId
    }
}

export const addOnFns = {
    findById(addOns: AddOn[], addOnId: AddOnId): AddOn {
        const found = addOns.find(a => a.id.value === addOnId.value);
        if (!found) {
            throw new Error(`No add-on found with id ${addOnId.value}, available ids are ${addOns.map(a => a.id.value).join(', ')}`);
        }
        return found;
    }
}

export function businessConfiguration(
    availability: BusinessAvailability,
    resources: Resource[],
    resourceAvailability: ResourceAvailability[],
    services: Service[],
    serviceOptions: ServiceOption[],
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
        serviceOptions,
        timeslots,
        startTimeSpec,
        addOns,
        forms,
        customerFormId
    };
}


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
    slot: StartTime;
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
    slot: StartTime,
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
