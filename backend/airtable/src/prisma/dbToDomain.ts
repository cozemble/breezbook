import { DbAddOn, DbBooking, DbForm, DbService } from './dbtypes.js';
import {
	addOn,
	AddOn as DomainAddOn,
	addOnId, Booking,
	currency, Form, formId,
	mandatory,
	price,
	ResourceType,
	service,
	Service as DomainService, serviceId
} from '@breezbook/packages-core';

export function toDomainService(s: DbService, resourceTypes: ResourceType[]): DomainService {
	const mappedResourceTypes = s.resource_types_required.map(rt => mandatory(resourceTypes.find(rtt => rtt.value === rt), `No resource type ${rt}`));
	const permittedAddOns = s.permitted_add_on_ids.map(id => addOnId(id));
	const result = service(s.name, s.description, mappedResourceTypes, s.duration_minutes, s.requires_time_slot, price(s.price.toNumber(), currency(s.price_currency)), permittedAddOns, serviceId(s.id));
	result.serviceFormId = s.form_id ? formId(s.form_id) : undefined;
	result.customerFormId = s.customer_form_id ? formId(s.customer_form_id) : undefined;
	return result;
}

export function toDomainBooking(b: DbBooking): Booking {
	return b.definition as unknown as Booking;
}

export function toDomainAddOn(a: DbAddOn): DomainAddOn {
	return addOn(a.name, price(a.price.toNumber(), currency(a.price_currency)), a.expect_quantity, addOnId(a.id));
}

export function toDomainForm(f: DbForm): Form {
	return f.definition as unknown as Form;
}
