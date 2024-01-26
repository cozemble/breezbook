import { v4 as uuidv4 } from 'uuid';
import { PriceAdjustment } from './calculatePrice.js';

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

export function tenantId(value: string): TenantId {
	return {
		_type: 'tenant.id',
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

export interface IsoDate extends ValueType<string> {
	_type: 'iso.date';
}

export function isoDate(value: string = new Date().toISOString().split('T')[0]): IsoDate {
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
		for (let date = from; date <= to; date.setDate(date.getDate() + 1)) {
			dates.push(isoDate(date.toISOString().split('T')[0]));
		}
		return dates;
	},
	addDays(date: IsoDate, days: number) {
		const d = new Date(date.value);
		d.setDate(d.getDate() + days);
		return isoDate(d.toISOString().split('T')[0]);
	},
	dayOfWeek(date: IsoDate) {
		return new Date(date.value).toLocaleDateString('en-GB', { weekday: 'long' }) as DayOfWeek;
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
		return dates.reduce((max, date) => (this.gte(date, max) ? date : max), dates[0]);
	},
	min(...dates: IsoDate[]) {
		return dates.reduce((min, date) => (this.lte(date, min) ? date : min), dates[0]);
	},
	toJavascriptDate(date: IsoDate, time: TwentyFourHourClockTime) {
		const [year, month, day] = date.value.split('-').map((s) => parseInt(s, 10));
		const [hours, minutes] = time.value.split(':').map((s) => parseInt(s, 10));
		return new Date(year, month - 1, day, hours, minutes);
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

export interface Duration extends ValueType<number> {
	_type: 'duration';
}

export function duration(value: number): Duration {
	return {
		_type: 'duration',
		value
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
};

export function resourceType(value: string): ResourceType {
	return {
		_type: 'resource.type',
		value
	};
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

export function bookingId(value: string): BookingId {
	return {
		_type: 'booking.id',
		value
	};
}

export interface ResourceId extends ValueType<string> {
	_type: 'resource.id';
}

export function serviceId(value: string): ServiceId {
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

export function id(value: string): Id {
	return {
		_type: 'id',
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

export interface Customer {
	id: CustomerId;
	firstName: string;
	lastName: string;
	email: Email;
	formData: unknown;
}

export function customer(firstName: string, lastName: string, emailStr: string, formData: unknown = null, id = customerId(uuidv4())): Customer {
	return {
		id,
		firstName,
		lastName,
		email: email(emailStr),
		formData
	};
}

export type BookableSlot = ExactTimeAvailability | TimeslotSpec;

export interface Booking {
	id: BookingId;
	customerId: CustomerId;
	date: IsoDate;
	slot: BookableSlot;
	serviceId: ServiceId;
	formData?: unknown;
}

export function booking(customerId: CustomerId, serviceId: ServiceId, date: IsoDate, slot: BookableSlot, id = bookingId(uuidv4())): Booking {
	return {
		id,
		customerId,
		date,
		slot,
		serviceId
	};
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

// export interface NumberWithoutDecimalPlaces extends ValueType<number> {
// 	_type: 'number.without.decimal.places';
// }
//
// export function numberWithoutDecimalPlaces(value: number): NumberWithoutDecimalPlaces {
// 	return {
// 		_type: 'number.without.decimal.places',
// 		value
// 	};
// }

export interface Currency extends ValueType<string> {
	_type: 'currency';
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
		return prices.reduce((total, aPrice) => price(total.amount.value + aPrice.amount.value, total.currency), price(0, prices[0].currency));
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
	}
};

export function currency(value: string): Currency {
	return {
		_type: 'currency',
		value
	};
}

export const GBP = currency('GBP');

export function price(amount: number, currency: Currency): Price {
	return {
		_type: 'price',
		amount: moneyInMinorUnits(amount),
		currency
	};
}

export interface Service {
	id: ServiceId;
	name: string;
	description: string;
	duration: number;
	resourceTypes: ResourceType[];
	requiresTimeslot: boolean;
	price: Price;
	permittedAddOns: AddOnId[];
	serviceFormIds: FormId[];
}

export function service(
	name: string,
	description: string,
	resourceTypes: ResourceType[],
	duration: number,
	requiresTimeslot: boolean,
	price: Price,
	permittedAddOns: AddOnId[],
	serviceFormIds: FormId[],
	id = serviceId(uuidv4())
): Service {
	return {
		id,
		name,
		description,
		duration,
		resourceTypes,
		requiresTimeslot,
		price,
		permittedAddOns,
		serviceFormIds
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
		value
	};
}

export function resource(type: ResourceType, name: string, id = resourceId(uuidv4())): FungibleResource {
	return {
		_type: 'fungible.resource',
		id,
		type,
		name
	};
}

export interface BusinessConfiguration {
	_type: 'business.configuration';
	availability: BusinessAvailability;
	resourceAvailability: ResourceDayAvailability[];
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

export function businessConfiguration(
	availability: BusinessAvailability,
	resources: ResourceDayAvailability[],
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
		resourceAvailability: resources,
		services,
		timeslots,
		startTimeSpec,
		addOns,
		forms,
		customerFormId
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
		slot
	};
}

export interface ResourcedTimeSlot extends BookableTimeSlot {
	_type: 'resourced.time.slot';
	resources: FungibleResource[];
	service: Service;
}

export function resourcedTimeSlot(slot: BookableTimeSlot, resources: FungibleResource[], service: Service): ResourcedTimeSlot {
	return {
		_type: 'resourced.time.slot',
		...slot,
		resources,
		service
	};
}

export interface BookableTimes {
	_type: 'bookable.times';
	date: IsoDate;
	bookableTimes: ExactTimeAvailability[];
}

export interface ResourceDayAvailability {
	resource: FungibleResource;
	availability: DayAndTimePeriod[];
}

export function resourceDayAvailability(resource: FungibleResource, availability: DayAndTimePeriod[]): ResourceDayAvailability {
	return {
		resource,
		availability
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
	splitPeriod(da: DayAndTimePeriod, bookingPeriod: DayAndTimePeriod): DayAndTimePeriod[] {
		if (!dayAndTimePeriodFns.overlaps(da, bookingPeriod)) {
			return [da];
		}
		const remainingTimePeriods = [] as TimePeriod[];
		if (timePeriodFns.startsEarlier(da.period, bookingPeriod.period)) {
			remainingTimePeriods.push(timePeriod(da.period.from, bookingPeriod.period.from));
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
		// return true if period2 has any time inside period
		return (
			(period2.from.value >= period.from.value && period2.from.value <= period.to.value) ||
			(period2.to.value >= period.from.value && period2.to.value <= period.to.value) ||
			(period2.from.value <= period.from.value && period2.to.value >= period.to.value)
		);
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
	servicePrice: Price,
	addOns: AddOnOrder[],
	date: IsoDate,
	slot: BookableSlot,
	serviceFormData: unknown[]
): OrderLine {
	return {
		_type: 'order.line',
		serviceId,
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

export function orderId(value: string): OrderId {
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
		return { fromDate, toDate };
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

export interface BusinessHours {
	_type: 'business.hours';
	id: Id;
	day_of_week: DayOfWeek;
	start_time_24hr: TwentyFourHourClockTime;
	end_time_24hr: TwentyFourHourClockTime;
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

export interface TimeBasedPriceAdjustmentSpec {
	_type: 'time.based.price.adjustment.spec';
	id: Id;
	timeSpec: TimeSpec;
	adjustment: PriceAdjustment;
}

export function timeBasedPriceAdjustmentSpec(timeSpec: TimeSpec, adjustment: PriceAdjustment, idValue = id(uuidv4())): TimeBasedPriceAdjustmentSpec {
	return {
		_type: 'time.based.price.adjustment.spec',
		id: idValue,
		timeSpec,
		adjustment
	};
}

export type PricingRuleSpec = TimeBasedPriceAdjustmentSpec;

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
	service: Service;
	addOn: AddOnWithTotal[];
	lineTotal: Price;
}

export function orderLineWithTotal(service: Service, servicePrice: Price, addOns: AddOnWithTotal[]): OrderLineWithTotal {
	const lineTotal = priceFns.add(
		servicePrice,
		addOns.reduce((total, addOn) => priceFns.add(total, addOn.addOnTotal), price(0, service.price.currency))
	);
	return {
		_type: 'order.line.with.total',
		service,
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
				: lineTotals.reduce((total, line) => priceFns.add(total, line.lineTotal), price(0, lineTotals[0].service.price.currency))
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
