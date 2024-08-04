import {
	AddOn,
	Booking,
	BusinessAvailability,
	Service,
	serviceFns,
	ServiceOption,
	serviceOptionFns,
	StartTimeSpec,
	TimeslotSpec,
	timeslotSpecFns
} from './types.js';
import { errorResponse, ErrorResponse, mandatory, success, Success } from './utils.js';
import {
	Capacity,
	capacityFns,
	dayAndTime,
	DayAndTime,
	dayAndTimeFns,
	dayAndTimePeriod,
	DayAndTimePeriod,
	duration,
	Duration,
	durationFns,
	exactTimeAvailability,
	ExactTimeAvailability,
	IsoDate,
	minuteFns,
	minutes,
	Minutes,
	time24Fns,
	TimePeriod,
	timePeriod,
	timePeriodFns,
	TwentyFourHourClockTime
} from '@breezbook/packages-types';
import { resourcing } from '@breezbook/packages-resourcing';
import { configuration } from './configuration/configuration.js';
import { ScheduleConfig } from './scheduleConfig.js';
import ResourceRequirement = resourcing.ResourceRequirement;
import Resource = resourcing.Resource;
import ResourceAvailability = configuration.ResourceAvailability;
import listAvailability = resourcing.listAvailability;
import resource = resourcing.resource;
import timeslot = resourcing.timeslot;
import dateAndTime = resourcing.dateAndTime;
import resourceRequirements = resourcing.resourceRequirements;
import resourceBookings = resourcing.resourceBookings;
import ResourceBookingResult = resourcing.ResourceBookingResult;

export type StartTime = TimeslotSpec | ExactTimeAvailability

export interface ResourceAllocation {
	_type: 'resource.allocation';
	requirement: ResourceRequirement;
	resource: Resource;
}

export function resourceAllocation(requirement: ResourceRequirement, resource: Resource): ResourceAllocation {
	return {
		_type: 'resource.allocation',
		requirement,
		resource
	};
}

export const startTimeFns = {
	fitAvailability(startTime: StartTime[], duration: Minutes, availability: DayAndTimePeriod[]): StartTime[] {
		return startTime.filter(st => {
			if (st._type === 'timeslot.spec') {
				return availability.some(a => timePeriodFns.overlaps(a.period, st.slot));
			}
			const period = timePeriod(st.time, time24Fns.addMinutes(st.time, duration));
			return availability.some(a => timePeriodFns.overlaps(a.period, period));
		});
	}
};

export interface TimeAndDuration {
	_type: 'time.and.duration';
	time: TwentyFourHourClockTime;
	duration: Duration;
}

export function timeAndDuration(time: TwentyFourHourClockTime, duration: Duration): TimeAndDuration {
	return {
		_type: 'time.and.duration',
		time,
		duration
	};
}


export type AvailableSlotTime = TimeAndDuration | TimeslotSpec

export const availableSlotTimeFns = {
	getStartTime(startTime: AvailableSlotTime): TwentyFourHourClockTime {
		if (startTime._type === 'time.and.duration') {
			return startTime.time;
		}
		return startTime.slot.from;
	},
	getEndTime(startTime: AvailableSlotTime): TwentyFourHourClockTime {
		if (startTime._type === 'time.and.duration') {
			return time24Fns.addDuration(startTime.time, startTime.duration);
		}
		return startTime.slot.to;
	}
};

export interface AvailableSlot {
	_type: 'available.slot';
	serviceRequest: ServiceRequest;
	startTime: AvailableSlotTime;
	resourceAllocation: ResourceAllocation[];
	possibleCapacity: Capacity;
	consumedCapacity: Capacity;
}

export function availableSlot(serviceRequest: ServiceRequest, startTime: AvailableSlotTime, resourceAllocation: ResourceAllocation[], possibleCapacity: Capacity,
															consumedCapacity: Capacity): AvailableSlot {
	return {
		_type: 'available.slot',
		serviceRequest,
		startTime,
		resourceAllocation,
		possibleCapacity,
		consumedCapacity
	};
}

export const availableSlotFns = {
	duration(slot: AvailableSlot): Duration {
		if (slot.startTime._type === 'time.and.duration') {
			return slot.startTime.duration;
		}
		return timeslotSpecFns.duration(slot.startTime);
	},
	servicePeriod(slot: AvailableSlot): TimePeriod {
		if (slot.startTime._type === 'time.and.duration') {
			return timePeriod(slot.startTime.time, time24Fns.addDuration(slot.startTime.time, slot.startTime.duration));
		}
		return timePeriod(availableSlotTimeFns.getStartTime(slot.startTime), availableSlotTimeFns.getEndTime(slot.startTime));
	}
};

function calcPossibleStartTimes(startTimeSpec: StartTimeSpec, availabilityForDay: DayAndTimePeriod[], serviceDuration: Minutes): TwentyFourHourClockTime[] {
	if (startTimeSpec._type === 'periodic.start.time') {
		return availabilityForDay.flatMap(a => {
			const possibleStartTimes = timePeriodFns.listPossibleStartTimes(a.period, durationFns.toMinutes(startTimeSpec.period));
			return possibleStartTimes.filter(time => time24Fns.addMinutes(time, serviceDuration).value <= a.period.to.value);
		});
	} else {
		return startTimeSpec.times;
	}
}

export interface AvailabilityConfiguration {
	_type: 'availability.configuration';
	availability: BusinessAvailability;
	resourceAvailability: ResourceAvailability[];
	timeslots: TimeslotSpec[];
	startTimeSpec: StartTimeSpec;
}

export function availabilityConfiguration(availability: BusinessAvailability, resourceAvailability: ResourceAvailability[], timeslots: TimeslotSpec[], startTimeSpec: StartTimeSpec): AvailabilityConfiguration {
	return {
		_type: 'availability.configuration',
		availability,
		resourceAvailability,
		timeslots,
		startTimeSpec
	};
}

export interface ServiceOptionAndQuantity {
	option: ServiceOption;
	quantity: number;
}

export function serviceOptionAndQuantity(option: ServiceOption, quantity: number): ServiceOptionAndQuantity {
	return { option, quantity };
}

export interface AddOnAndQuantity {
	addOn: AddOn;
	quantity: number;
}

export function addOnAndQuantity(addOn: AddOn, quantity: number): AddOnAndQuantity {
	return { addOn, quantity };
}

export interface ServiceRequest {
	_type: 'service.request';
	date: IsoDate;
	service: Service;
	duration: Duration;
	options: ServiceOptionAndQuantity[];
	addOns: AddOnAndQuantity[];
}

export const serviceRequestFns = {
	duration(request: ServiceRequest): Duration {
		return request.duration;
	}
};

export function serviceRequest(service: Service, date: IsoDate, addOns: AddOnAndQuantity[] = [], options: ServiceOptionAndQuantity[] = [], specificDuration?: Duration): ServiceRequest {
	const theDuration = specificDuration ?? serviceFns.duration(service);
	return {
		_type: 'service.request',
		date,
		service,
		duration: theDuration,
		addOns,
		options
	};
}

function toPeriod(date: IsoDate, possibleStartTime: StartTime, serviceDuration: Minutes): DayAndTimePeriod {
	if (possibleStartTime._type === 'timeslot.spec') {
		return dayAndTimePeriod(date, possibleStartTime.slot);
	}
	return dayAndTimePeriod(date, timePeriod(possibleStartTime.time, time24Fns.addMinutes(possibleStartTime.time, serviceDuration)));
}

function toService(serviceRequest: ServiceRequest): resourcing.Service {
	const totalRequirements = [...serviceRequest.service.resourceRequirements, ...serviceRequest.options.flatMap(o => o.option.resourceRequirements)];
	const requirements = serviceRequest.service.capacity.value > 1 ? resourceRequirements(totalRequirements, serviceRequest.service.capacity) : resourceRequirements(totalRequirements);
	return resourcing.service(requirements, serviceRequest.service.id);
}

function mapResourceAvailability(acc: Resource[], rda: ResourceAvailability): Resource[] {
	const theResource = acc.find(r => r.id.value === rda.resource.id.value) ?? resource(rda.resource.type, [], rda.resource.metadata, rda.resource.id);
	const timeslots = rda.availability.map(a => timeslot(dateAndTime(a.when.day, a.when.period.from), dateAndTime(a.when.day, a.when.period.to)));
	const updatedResource: Resource = { ...theResource, availability: [...theResource.availability, ...timeslots] };
	// replace or append the resource
	return acc.filter(r => r.id.value !== rda.resource.id.value).concat(updatedResource);
}

function toResourceableBooking(booking: Booking, resources: Resource[]): resourcing.Booking {
	const requirements = booking.service.capacity.value === 1 ? resourceRequirements(booking.service.resourceRequirements) : resourceRequirements(booking.service.resourceRequirements, booking.service.capacity);
	const service: resourcing.Service = resourcing.service(requirements, booking.service.id);
	const fixedResourceCommitments = booking.fixedResourceAllocation.map(r => {
		const requirement = mandatory(service.resourceRequirements.resourceRequirements.find(rr => rr.id.value === r.requirementId.value), `No resource requirement for id '${r.requirementId.value}'`);
		const resource = mandatory(resources.find(res => res.id.value === r.resourceId.value), `No resource for id '${r.resourceId.value}'`);
		return resourcing.resourceCommitment(requirement, resource);
	});
	const totalCapacity = capacityFns.sum(booking.bookedCapacity, ...booking.serviceOptions.filter(so => serviceOptionFns.consumesServiceCapacity(so.serviceOption)).map(so => serviceOptionFns.getConsumedServiceCapacity(so.serviceOption, so.quantity)));
	return resourcing.booking(
		timeslot(dateAndTime(booking.date, booking.period.from), dateAndTime(booking.date, booking.period.to)),
		service, fixedResourceCommitments, totalCapacity, booking.id);
}

function startTimeForResponse(availabilityOutcome: resourcing.Available, startTimes: StartTime[] | null, durationMinutes: Minutes): AvailableSlotTime {
	if (startTimes && startTimes.length > 0 && startTimes?.[0]?._type === 'timeslot.spec') {
		const timeSlots = startTimes as TimeslotSpec[];
		return mandatory(
			timeSlots.find(ts => time24Fns.equals(ts.slot.from, availabilityOutcome.booking.booking.timeslot.from.time)),
			`No start time found for timeslot ${availabilityOutcome.booking.booking.timeslot.from.time.value} in ${timeSlots.map(ts => ts.slot.from.value).join(',')}`);

	}
	return timeAndDuration(availabilityOutcome.booking.booking.timeslot.from.time, duration(durationMinutes));
}

function getDayAvailability(config: AvailabilityConfiguration, date: IsoDate): DayAndTimePeriod[] {
	return config.availability.availability.filter(a => a.day.value === date.value);
}

function getAvailability(config: AvailabilityConfiguration, serviceRequest: ServiceRequest, bookings: Booking[], businessAvailabilityForDay: DayAndTimePeriod[]): {
	duration: Minutes,
	availabilityOutcomes: resourcing.AvailabilityResult[]
} {
	const mappedResources = config.resourceAvailability.reduce(mapResourceAvailability, [] as Resource[]);
	const service = toService(serviceRequest);
	const mappedBookings = bookings.map(b => toResourceableBooking(b, mappedResources));
	const bookingSpec = resourcing.bookingSpec(service);
	const duration = [durationFns.toMinutes(serviceRequestFns.duration(serviceRequest)), ...serviceRequest.options.map(o => durationFns.toMinutes(o.option.duration))].reduce((acc, d) => minuteFns.sum(acc, d), minutes(0));
	const serviceStartTimes = serviceFns.startTimes(serviceRequest.service, duration);
	const possibleStartTimes = serviceStartTimes ? startTimeFns.fitAvailability(serviceStartTimes, duration, businessAvailabilityForDay) : calcPossibleStartTimes(config.startTimeSpec, businessAvailabilityForDay, duration).map(exactTimeAvailability);
	const requestedSlots = possibleStartTimes.map(st => toPeriod(serviceRequest.date, st, duration)).map(p => timeslot(dateAndTime(p.day, p.period.from), dateAndTime(p.day, p.period.to)));
	const availabilityOutcomes = listAvailability(mappedResources, mappedBookings, bookingSpec, requestedSlots);
	return { duration, availabilityOutcomes };
}

function meetsMinimumNoticePeriod(now: DayAndTime, scheduleConfig: ScheduleConfig | Duration, date: IsoDate, slot: AvailableSlot): boolean {
	if (scheduleConfig._type === 'duration') {
		return true;
	}
	const noticePeriod = scheduleConfig.minimumNoticePeriod;
	if (!noticePeriod) {
		return true;
	}
	const earliestStartTime = dayAndTimeFns.addDuration(now, noticePeriod.duration);
	const slotStartTime = dayAndTime(date, availableSlotTimeFns.getStartTime(slot.startTime));
	return dayAndTimeFns.gte(slotStartTime, earliestStartTime);
}

export const availability = {
	errorCodes: {
		noAvailabilityForDay: 'no.availability.for.day',
		noResourcesAvailable: 'no.resources.available',
		unresourceableBooking: 'unresourceable.booking'
	},
	calculateAvailableSlots: (config: AvailabilityConfiguration,
														bookings: Booking[],
														serviceRequest: ServiceRequest,
														now: DayAndTime): Success<AvailableSlot[]> | ErrorResponse => {
		const date = serviceRequest.date;
		const businessAvailabilityForDay = getDayAvailability(config, date);
		if (businessAvailabilityForDay.length === 0) {
			return errorResponse(availability.errorCodes.noAvailabilityForDay, `No availability for date '${date.value}'`);
		}
		const {
			duration,
			availabilityOutcomes
		} = getAvailability(config, serviceRequest, bookings, businessAvailabilityForDay);
		const result = [] as AvailableSlot[];
		for (const availabilityOutcome of availabilityOutcomes) {
			if (availabilityOutcome._type === 'available') {
				result.push(availableSlot(
					serviceRequest,
					startTimeForResponse(availabilityOutcome, serviceFns.startTimes(serviceRequest.service, duration), duration),
					availabilityOutcome.booking.resourceCommitments.map(r => resourceAllocation(r.requirement, r.resource)),
					availabilityOutcome.potentialCapacity,
					availabilityOutcome.consumedCapacity
				));
			}
		}
		return success(result.filter(slot => meetsMinimumNoticePeriod(now, serviceRequest.service.scheduleConfig, date, slot)));
	},
	checkAvailability(config: AvailabilityConfiguration, existingBookings: Booking[], newBookings: Booking[]): ResourceBookingResult[] {
		const mappedResources = config.resourceAvailability.reduce(mapResourceAvailability, [] as Resource[]);
		const mappedBookings = [...existingBookings, ...newBookings].map(b => toResourceableBooking(b, mappedResources));
		const expectedBookingIds = newBookings.map(b => b.id.value);
		return resourceBookings(mappedResources, mappedBookings).resourced.filter(r => expectedBookingIds.includes(r.booking.id.value));
	}
};