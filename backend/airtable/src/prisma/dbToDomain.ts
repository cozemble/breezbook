import { DbAddOn, DbBooking, DbForm, DbService, DbServiceForm, DbTenantSettings, DbTimeSlot } from './dbtypes.js';
import {
	addOn,
	AddOn as DomainAddOn,
	addOnId, booking,
	Booking,
	currency, customerId, exactTimeAvailability,
	Form,
	formId, isoDate,
	mandatory,
	price,
	ResourceType,
	service,
	Service as DomainService,
	serviceId, tenantSettings, TenantSettings, time24, TimeslotSpec
} from '@breezbook/packages-core';

export function toDomainService(dbService: DbService, resourceTypes: ResourceType[], dbServiceForms: DbServiceForm[]): DomainService {
	const mappedResourceTypes = dbService.resource_types_required.map(rt => mandatory(resourceTypes.find(rtt => rtt.value === rt), `No resource type ${rt}`));
	const permittedAddOns = dbService.permitted_add_on_ids.map(id => addOnId(id));
	const forms = dbServiceForms.filter(sf => sf.s_id === dbService.id).map(sf => formId(sf.form_id));
	return service(dbService.name, dbService.description, mappedResourceTypes, dbService.duration_minutes, dbService.requires_time_slot, price(dbService.price.toNumber(), currency(dbService.price_currency)), permittedAddOns, forms, serviceId(dbService.id));
}

export function toDomainBooking(b: DbBooking, timeslots:TimeslotSpec[]): Booking {
	const slot = b.time_slot_id ? mandatory(timeslots.find(ts => ts.id.value === b.time_slot_id), `No timeslot with id ${b.time_slot_id}`) : exactTimeAvailability(time24(b.start_time_24hr))
	return booking(customerId(b.customer_id), serviceId(b.service_id), isoDate(b.date), slot)
}

export function toDomainAddOn(a: DbAddOn): DomainAddOn {
	return addOn(a.name, price(a.price.toNumber(), currency(a.price_currency)), a.expect_quantity, addOnId(a.id));
}

export function toDomainForm(f: DbForm): Form {
	return f.definition as unknown as Form;
}

export function toDomainTenantSettings(settings:DbTenantSettings):TenantSettings{
	return tenantSettings(settings.customer_form_id ? formId(settings.customer_form_id) : null);
}