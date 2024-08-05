import {
	DbAddOn,
	DbForm,
	DbPricingRule,
	DbResource,
	DbResourceType,
	DbService,
	DbServiceAddOn,
	DbServiceForm,
	DbServiceOptionResourceRequirement,
	DbServiceResourceRequirement,
	DbTenantSettings,
	DbTimeSlot
} from './dbtypes.js';
import {
	addOn,
	AddOn as DomainAddOn,
	booking,
	Booking,
	bookingFns,
	currency,
	customerId,
	fixedResourceAllocation,
	mandatory,
	price,
	service,
	Service as DomainService,
	Service,
	serviceFns,
	ServiceImpact,
	serviceOption,
	ServiceOption,
	tenantSettings,
	TenantSettings,
	timeslotSpec,
	TimeslotSpec
} from '@breezbook/packages-core';
import {
	DbBookingAndResourceRequirements,
	DbServiceOptionFormsAndResources
} from '../express/getEverythingForAvailability.js';
import { PricingRule } from '@breezbook/packages-pricing';
import {
	addOnId,
	byId,
	capacity,
	Form,
	formId,
	id,
	resourceId,
	resourceRequirementId,
	resourceType,
	serviceId,
	serviceOptionId
} from '@breezbook/packages-types';
import { resourcing } from '@breezbook/packages-resourcing';
import { ScheduleConfig } from '@breezbook/packages-core/dist/scheduleConfig.js';
import { duration, isoDate, time24, timePeriod, minutes } from '@breezbook/packages-date-time';
import ResourceRequirement = resourcing.ResourceRequirement;
import specificResource = resourcing.specificResource;
import anySuitableResource = resourcing.anySuitableResource;
import resource = resourcing.resource;
import Resource = resourcing.Resource;
import resourceAllocationRules = resourcing.resourceAllocationRules;

function toDomainResourceRequirement(rr: DbServiceResourceRequirement | DbServiceOptionResourceRequirement, resourceTypes: DbResourceType[], mappedResources: Resource[]): ResourceRequirement {
	if (rr.requirement_type === 'specific_resource') {
		return specificResource(byId.find(mappedResources, resourceId(rr.id)), resourceRequirementId(rr.id));
	} else {
		const dbResourceType = mandatory(resourceTypes.find(rt => rt.id === rr.resource_type), `No resource type found for resource requirement ${rr.resource_type}`);
		return anySuitableResource(resourceType(dbResourceType.name), resourceAllocationRules.any, resourceRequirementId(rr.id));
	}
}

export function toDomainServiceOption(so: DbServiceOptionFormsAndResources, resourceTypes: DbResourceType[], mappedResources: Resource[]): ServiceOption {
	const mappedResourceRequirements = so.service_option_resource_requirements.map(rr => toDomainResourceRequirement(rr, resourceTypes, mappedResources));
	const priceAmount = (typeof so.price === 'object' && 'toNumber' in so.price) ? so.price.toNumber() : so.price;
	const formIds = so.service_option_forms.map(f => formId(f.form_id));
	return serviceOption(
		price(priceAmount, currency(so.price_currency)),
		so.requires_quantity,
		duration(minutes(so.duration_minutes)),
		mappedResourceRequirements,
		formIds,
		so.service_impacts as unknown as ServiceImpact[],
		serviceOptionId(so.id));
}

export function toDomainService(dbService: DbService, addOns: DbServiceAddOn[], resourceTypes: DbResourceType[], dbServiceForms: DbServiceForm[], resourceRequirements: DbServiceResourceRequirement[], mappedResources: Resource[], scheduleConfig: ScheduleConfig): DomainService {
	const permittedAddOns = addOns.filter((sa) => sa.service_id === dbService.id).map(s => addOnId(s.add_on_id));
	const mappedResourceRequirements = resourceRequirements.filter(rr => rr.service_id === dbService.id).map(rr => toDomainResourceRequirement(rr, resourceTypes, mappedResources));
	const forms = dbServiceForms.filter((sf) => sf.service_id === dbService.id).map((sf) => formId(sf.form_id));
	const priceAmount = (typeof dbService.price === 'object' && 'toNumber' in dbService.price) ? dbService.price.toNumber() : dbService.price;
	return service(
		mappedResourceRequirements,
		price(priceAmount, currency(dbService.price_currency)),
		permittedAddOns,
		forms,
		scheduleConfig,
		capacity(dbService.capacity),
		serviceId(dbService.id)
	);
}

export function toDomainTimeslotSpec(ts: DbTimeSlot): TimeslotSpec {
	return timeslotSpec(time24(ts.start_time_24hr), time24(ts.end_time_24hr), ts.description, id(ts.id));
}

export function toDomainBooking(b: DbBookingAndResourceRequirements, services: Service[]): Booking {
	const service = serviceFns.findService(services, serviceId(b.service_id));
	const fixedResourceAllocations = b.booking_resource_requirements.flatMap(r => {
		if (r.requirement_type === 'specific_resource') {
			return [fixedResourceAllocation(resourceRequirementId(r.requirement_id), resourceId(mandatory(r.resource_id, `resource_id`)))];
		}
		return [];
	});
	const domainBooking = booking(customerId(b.customer_id), service, isoDate(b.date), timePeriod(time24(b.start_time_24hr), time24(b.end_time_24hr)), [], [], capacity(b.booked_capacity), fixedResourceAllocations);
	if (b.status === 'cancelled') {
		return bookingFns.cancel(domainBooking);
	}
	return domainBooking;
}

export function toDomainAddOn(a: DbAddOn): DomainAddOn {
	const priceAmount = (typeof a.price === 'object' && 'toNumber' in a.price) ? a.price.toNumber() : a.price;
	return addOn(price(priceAmount, currency(a.price_currency)), a.expect_quantity, addOnId(a.id));
}

export function toDomainForm(f: DbForm): Form {
	const form = f.definition as unknown as Form;
	if (form._type === 'json.schema.form') {
		return { ...form, id: formId(f.id) };
	}
	throw new Error(`Unknown form type`);
}

export function toDomainTenantSettings(settings: DbTenantSettings): TenantSettings {
	return tenantSettings(settings.customer_form_id ? formId(settings.customer_form_id) : null);
}

export function toDomainPricingRule(rule: DbPricingRule): PricingRule {
	return rule.definition as unknown as PricingRule;
}

export function toDomainResource(r: DbResource, dbResourceTypes: DbResourceType[]): Resource {
	const dbResourceType = mandatory(dbResourceTypes.find(rt => rt.id === r.resource_type), `No resource type found for resource ${r.id}`);
	return resource(resourceType(dbResourceType.name), [], r.metadata as any ?? {}, resourceId(r.id));
}