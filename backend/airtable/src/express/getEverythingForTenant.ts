import {
	Booking,
	businessConfiguration,
	BusinessConfiguration,
	DayAndTimePeriod,
	dayAndTimePeriod,
	dayAndTimePeriodFns,
	duration,
	formId,
	FungibleResource,
	isoDate,
	IsoDate,
	isoDateFns,
	mandatory,
	periodicStartTime,
	PricingRule,
	resource,
	resourceDayAvailability,
	ResourceDayAvailability,
	resourceId,
	ResourceType,
	resourceType,
	TenantId,
	time24,
	timePeriod,
	timeslotSpec,
	values
} from '@breezbook/packages-core';
import { makeBusinessAvailability } from './makeBusinessAvailability.js';
import { DbResource, DbResourceAvailability, DbResourceBlockedTime } from '../prisma/dbtypes.js';
import { prisma } from '../prisma/client.js';
import { toDomainAddOn, toDomainBooking, toDomainForm, toDomainService } from '../prisma/dbToDomain.js';

export interface EverythingForTenant {
	_type: 'everything.for.tenant';
	businessConfiguration: BusinessConfiguration;
	pricingRules: PricingRule[];
	bookings: Booking[];
}

export function everythingForTenant(businessConfiguration: BusinessConfiguration, pricingRules: PricingRule[], bookings: Booking[]): EverythingForTenant {
	return {
		_type: 'everything.for.tenant',
		businessConfiguration,
		pricingRules,
		bookings
	};
}

interface FlattenedResourceDayAvailability {
	resource: FungibleResource;
	availability: DayAndTimePeriod;
}

function flattenedResourceDayAvailability(resource: FungibleResource, availability: DayAndTimePeriod): FlattenedResourceDayAvailability {
	return {
		resource,
		availability
	};
}

function resourceAvailabilityForDate(date: IsoDate, resources: FungibleResource[], dbResourceAvailabilities: DbResourceAvailability[]): FlattenedResourceDayAvailability[] {
	const dayOfWeek = isoDateFns.dayOfWeek(date);
	return resources.flatMap(resource => {
		const dbAvailability = dbResourceAvailabilities.filter(ra => ra.resource_id === resource.id.value && ra.day_of_week === dayOfWeek);
		if (dbAvailability.length === 0) {
			return [];
		}
		return dbAvailability.map(da => {
			return {
				resource,
				availability: dayAndTimePeriod(date, timePeriod(time24(da.start_time_24hr), time24(da.end_time_24hr)))
			};
		});
	});
}

export function makeResourceAvailability(mappedResourceTypes: ResourceType[], resources: DbResource[], resourceAvailabilities: DbResourceAvailability[], resourceOutage: DbResourceBlockedTime[], dates: IsoDate[]): ResourceDayAvailability[] {
	const mappedResources = resources.map(r => resource(mandatory(mappedResourceTypes.find(rt => rt.value === r.resource_type), `No resource type ${r.resource_type}`), r.name, resourceId(r.id)));
	let availability = dates.flatMap(date => resourceAvailabilityForDate(date, mappedResources, resourceAvailabilities));
	availability = availability.flatMap(avail => {
		const outages = resourceOutage.filter(ro => ro.resource_id === avail.resource.id.value && isoDateFns.sameDay(isoDate(ro.date), avail.availability.day));
		if (outages.length === 0) {
			return [avail];
		}
		return outages.flatMap(outage => {
			const newPeriods = dayAndTimePeriodFns.splitPeriod(avail.availability, dayAndTimePeriod(isoDate(outage.date), timePeriod(time24(outage.start_time_24hr), time24(outage.end_time_24hr))));
			return newPeriods.map(period => flattenedResourceDayAvailability(avail.resource, period));
		});
	});
	return availability.reduce((acc, curr) => {
		const existing = acc.find(a => values.isEqual(a.resource.id, curr.resource.id));
		if (existing) {
			existing.availability.push(curr.availability);
			return acc;
		}
		return [...acc, resourceDayAvailability(curr.resource, [curr.availability])];
	}, [] as ResourceDayAvailability[]);
}


export async function getEverythingForTenant(tenantId: TenantId, fromDate: IsoDate, toDate: IsoDate): Promise<EverythingForTenant> {
	const businessHours = await prisma.business_hours.findMany({ where: { tenant_id: tenantId.value } });
	const blockedTime = await prisma.blocked_time.findMany({
		where: {
			tenant_id: tenantId.value,
			date: {
				gte: fromDate.value,
				lte: toDate.value
			}
		}
	});
	const resources = await prisma.resources.findMany({ where: { tenant_id: tenantId.value } });

	const resourceAvailability = await prisma.resource_availability.findMany({ where: { tenant_id: tenantId.value } });
	const resourceOutage = await prisma.resource_blocked_time.findMany({
		where: {
			tenant_id: tenantId.value,
			date: {
				gte: fromDate.value,
				lte: toDate.value
			}
		}
	});
	const services = await prisma.services.findMany({ where: { tenant_id: tenantId.value } });
	const timeSlots = await prisma.time_slots.findMany({ where: { tenant_id: tenantId.value } });
	const pricingRules = await prisma.pricing_rules.findMany({ where: { tenant_id: tenantId.value } });
	const resourceTypes = await prisma.resource_types.findMany({ where: { tenant_id: tenantId.value } });
	const addOns = await prisma.add_on.findMany({ where: { tenant_id: tenantId.value } });
	const bookings = await prisma.bookings.findMany({
		where: {
			tenant_id: tenantId.value,
			date: {
				gte: fromDate.value,
				lte: toDate.value
			}
		}
	});
	const forms = await prisma.forms.findMany({ where: { tenant_id: tenantId.value } });

	const tenantSettings = await prisma.tenant_settings.findFirstOrThrow({ where: { tenant_id: tenantId.value } });

	const dates = isoDateFns.listDays(fromDate, toDate);
	const mappedResourceTypes = resourceTypes.map(rt => resourceType(rt.id));
	const mappedAddOns = addOns.map(a => toDomainAddOn(a));
	const mappedForms = forms.map(f => toDomainForm(f));
	const customerFormId = tenantSettings.customer_form_id;
	const customerForm = customerFormId ? mandatory(mappedForms.find(f => values.isEqual(f.id, formId(customerFormId))), `No customer form ${tenantSettings.customer_form_id}`) : undefined;

	return everythingForTenant(businessConfiguration(
		makeBusinessAvailability(businessHours, blockedTime, dates),
		makeResourceAvailability(mappedResourceTypes, resources, resourceAvailability, resourceOutage, dates),
		services.map(s => toDomainService(s, mappedResourceTypes)),
		mappedAddOns,
		timeSlots.map(ts => timeslotSpec(time24(ts.start_time_24hr), time24(ts.end_time_24hr), ts.description)),
		mappedForms,
		periodicStartTime(duration(30)),
		customerForm ? customerForm.id : null
	), pricingRules.map(pr => pr.definition as unknown) as PricingRule[], bookings.map(b => toDomainBooking(b)));
}