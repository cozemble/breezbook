import {
	Booking,
	businessConfiguration,
	BusinessConfiguration,
	configuration,
	Coupon,
	periodicStartTime,
	scheduleConfig,
	ScheduleConfig,
	singleDaySchedulingFns,
	TenantSettings
} from '@breezbook/packages-core';
import {
	DayAndTimePeriod,
	dayAndTimePeriod,
	dayAndTimePeriodFns,
	duration,
	isoDate,
	IsoDate,
	isoDateFns,
	minutes,
	time24,
	timePeriod, timezone,
	Timezone
} from '@breezbook/packages-date-time';
import { formId, mandatory, TenantEnvironment, values } from '@breezbook/packages-types';
import { makeBusinessAvailability } from './makeBusinessAvailability.js';
import {
	DbAddOn,
	DbBlockedTime,
	DbBooking,
	DbBookingAddOn,
	DbBookingResourceRequirement,
	DbBookingServiceOption,
	DbBusinessHours,
	DbCoupon,
	DbForm, DbLocation,
	DbPricingRule,
	DbResource,
	DbResourceAvailability,
	DbResourceBlockedTime,
	DbResourceType,
	DbService,
	DbServiceAddOn,
	DbServiceForm,
	DbServiceOption,
	DbServiceOptionForm,
	DbServiceOptionResourceRequirement,
	DbServiceResourceRequirement,
	DbServiceScheduleConfig,
	DbTenantSettings,
	DbTimeSlot,
	findManyForTenant
} from '../prisma/dbtypes.js';
import {
	toDomainAddOn,
	toDomainBooking,
	toDomainForm,
	toDomainPricingRule,
	toDomainResource,
	toDomainService,
	toDomainServiceOption,
	toDomainTenantSettings,
	toDomainTimeslotSpec
} from '../prisma/dbToDomain.js';
import { PricingRule } from '@breezbook/packages-pricing';
import { resourcing } from '@breezbook/packages-resourcing';
import { PrismaClient } from '@prisma/client';
import Resource = resourcing.Resource;
import ResourceAvailability = configuration.ResourceAvailability;
import availabilityBlock = configuration.availabilityBlock;
import resourceDayAvailability = configuration.resourceAvailability;

export interface EverythingForAvailability {
	_type: 'everything.for.availability';
	businessConfiguration: BusinessConfiguration;
	pricingRules: PricingRule[];
	bookings: Booking[];
	coupons: Coupon[];
	tenantSettings: TenantSettings;
	tenantEnvironment: TenantEnvironment;
	locationTimezone: Timezone;
}

export function everythingForAvailability(
	businessConfiguration: BusinessConfiguration,
	pricingRules: PricingRule[],
	bookings: Booking[],
	coupons: Coupon[],
	tenantSettings: TenantSettings,
	tenantEnvironment: TenantEnvironment,
	locationTimezone: Timezone
): EverythingForAvailability {
	return {
		_type: 'everything.for.availability',
		businessConfiguration,
		pricingRules,
		bookings,
		coupons,
		tenantSettings,
		tenantEnvironment,
		locationTimezone
	};
}

interface FlattenedResourceAvailability {
	resource: Resource;
	availability: DayAndTimePeriod;
}

function flattenedResourceAvailability(resource: Resource, availability: DayAndTimePeriod): FlattenedResourceAvailability {
	return {
		resource,
		availability
	};
}

function resourceAvailabilityForDate(
	date: IsoDate,
	resources: Resource[],
	dbResourceAvailabilities: DbResourceAvailability[]
): FlattenedResourceAvailability[] {
	const dayOfWeek = isoDateFns.dayOfWeek(date);
	return resources.flatMap((resource) => {
		const dbAvailability = dbResourceAvailabilities.filter((ra) => ra.resource_id === resource.id.value && ra.day_of_week === dayOfWeek);
		if (dbAvailability.length === 0) {
			return [];
		}
		return dbAvailability.map((da) => {
			return {
				resource,
				availability: dayAndTimePeriod(date, timePeriod(time24(da.start_time_24hr), time24(da.end_time_24hr)))
			};
		});
	});
}

export function makeResourceAvailability(
	mappedResources: Resource[],
	resourceAvailabilities: DbResourceAvailability[],
	resourceOutage: DbResourceBlockedTime[],
	dates: IsoDate[]
): ResourceAvailability[] {
	let availability = dates.flatMap((date) => resourceAvailabilityForDate(date, mappedResources, resourceAvailabilities));
	availability = availability.flatMap((avail) => {
		const outages = resourceOutage.filter((ro) => ro.resource_id === avail.resource.id.value && isoDateFns.sameDay(isoDate(ro.date), avail.availability.day));
		if (outages.length === 0) {
			return [avail];
		}
		return outages.flatMap((outage) => {
			const newPeriods = dayAndTimePeriodFns.splitPeriod(
				avail.availability,
				dayAndTimePeriod(isoDate(outage.date), timePeriod(time24(outage.start_time_24hr), time24(outage.end_time_24hr)))
			);
			return newPeriods.map((period) => flattenedResourceAvailability(avail.resource, period));
		});
	});
	return availability.reduce((acc, curr) => {
		const existing = acc.find((a) => values.isEqual(a.resource.id, curr.resource.id));
		if (existing) {
			existing.availability.push(availabilityBlock(curr.availability));
			return acc;
		}
		return [...acc, resourceDayAvailability(curr.resource, [availabilityBlock(curr.availability)])];
	}, [] as ResourceAvailability[]);
}

export type DbBookingAndResourceRequirements = DbBooking &
	{
		booking_resource_requirements: DbBookingResourceRequirement[],
		booking_add_ons: DbBookingAddOn[],
		booking_service_options: DbBookingServiceOption[]
	};

export type DbServiceOptionFormsAndResources = (DbServiceOption & {
	service_option_forms: DbServiceOptionForm[]
	service_option_resource_requirements: DbServiceOptionResourceRequirement[]
})

export interface AvailabilityData {
	location: DbLocation
	businessHours: DbBusinessHours[];
	blockedTime: DbBlockedTime[];
	resources: DbResource[];
	resourceAvailability: DbResourceAvailability[];
	resourceOutage: DbResourceBlockedTime[];
	services: DbService[];
	serviceScheduleConfigs: DbServiceScheduleConfig[];
	serviceAddOns: DbServiceAddOn[];
	serviceOptions: DbServiceOptionFormsAndResources[];
	serviceResourceRequirements: DbServiceResourceRequirement[];
	timeSlots: DbTimeSlot[];
	pricingRules: DbPricingRule[];
	resourceTypes: DbResourceType[];
	addOns: DbAddOn[];
	serviceForms: DbServiceForm[];
	bookings: DbBookingAndResourceRequirements[];
	forms: DbForm[];
	tenantSettings: DbTenantSettings;
	coupons: DbCoupon[];
}

export function convertAvailabilityDataIntoEverythingForAvailability(tenantEnvironment: TenantEnvironment, fromDate: IsoDate, toDate: IsoDate, availabilityData: AvailabilityData) {
	const coupons = availabilityData.coupons.map((c) => c.definition as unknown as Coupon);

	const dates = isoDateFns.listDays(fromDate, toDate);
	const mappedAddOns = availabilityData.addOns.map((a) => toDomainAddOn(a));
	const mappedForms = availabilityData.forms.map((f) => toDomainForm(f));
	const customerFormId = availabilityData.tenantSettings.customer_form_id;
	const customerForm = customerFormId
		? mandatory(
			mappedForms.find((f) => values.isEqual(f.id, formId(customerFormId))),
			`No customer form ${availabilityData.tenantSettings.customer_form_id}, options are ${mappedForms.map(f => f.id.value).join(',')}`
		)
		: undefined;
	const mappedTimeSlots = availabilityData.timeSlots.map(toDomainTimeslotSpec);
	const mappedResources = availabilityData.resources.map((r) => toDomainResource(r, availabilityData.resourceTypes));

	const mappedResourceAvailability = makeResourceAvailability(mappedResources, availabilityData.resourceAvailability, availabilityData.resourceOutage, dates);
	const businessAvailability = makeBusinessAvailability(availabilityData.businessHours, availabilityData.blockedTime, dates);
	const services = availabilityData.services.map((s) => {
		const applicableScheduleConfig = availabilityData.serviceScheduleConfigs.find((sc) => sc.service_id === s.id);
		const theScheduleConfig = applicableScheduleConfig ? applicableScheduleConfig.schedule_config as unknown as ScheduleConfig : scheduleConfig(singleDaySchedulingFns.alwaysAvailable());
		return toDomainService(s, availabilityData.serviceAddOns, availabilityData.resourceTypes, availabilityData.serviceForms, availabilityData.serviceResourceRequirements, mappedResources, theScheduleConfig);
	});
	const serviceOptions = availabilityData.serviceOptions.map((so) => toDomainServiceOption(so, availabilityData.resourceTypes, mappedResources));

	return everythingForAvailability(
		businessConfiguration(
			businessAvailability,
			mappedResources,
			mappedResourceAvailability,
			services,
			serviceOptions,
			mappedAddOns,
			mappedTimeSlots,
			mappedForms,
			periodicStartTime(duration(minutes(30))),
			customerForm ? customerForm.id : null,
		),
		availabilityData.pricingRules.map((pr) => toDomainPricingRule(pr)),
		availabilityData.bookings.map((b) => toDomainBooking(b, services)),
		coupons,
		toDomainTenantSettings(availabilityData.tenantSettings),
		tenantEnvironment,
		timezone(availabilityData.location.iana_timezone)
	);
}