import { DbAddOn, DbBooking, DbForm, DbPricingRule, DbService, DbServiceForm, DbTenantSettings, DbTimeSlot } from './dbtypes.js';
import {
	addOn,
	AddOn as DomainAddOn,
	addOnId,
	booking,
	Booking,
	currency,
	customerId,
	dayAndTimePeriod,
	DayAndTimePeriod,
	exactTimeAvailability,
	Form,
	formId,
	id,
	isoDate,
	isoDateFns,
	mandatory,
	price,
	PricingRule,
	PricingRuleSpec,
	ResourceType,
	service,
	Service as DomainService,
	serviceId,
	tenantSettings,
	TenantSettings,
	time24,
	timePeriodFns,
	timeslotSpec,
	TimeslotSpec,
	TimeSpec,
	timezone,
	anySuitableResource, serviceFns
} from '@breezbook/packages-core';
import { timeBasedPriceAdjustment } from '@breezbook/packages-core/dist/calculatePrice.js';

export function toDomainService(dbService: DbService, resourceTypes: ResourceType[], dbServiceForms: DbServiceForm[], timeslots:TimeslotSpec[]): DomainService {
	const mappedResourceTypes = dbService.resource_types_required.map((rt) =>
		mandatory(
			resourceTypes.find((rtt) => rtt.value === rt),
			`No resource type ${rt}`
		)
	);
	const permittedAddOns = dbService.permitted_add_on_ids.map((id) => addOnId(id));
	const forms = dbServiceForms.filter((sf) => sf.service_id === dbService.id).map((sf) => formId(sf.form_id));
	const priceAmount = (typeof dbService.price === "object" && "toNumber" in dbService.price) ? dbService.price.toNumber() : dbService.price;
	let theService = service(
		dbService.name,
		dbService.description,
		mappedResourceTypes.map((rt) => anySuitableResource(rt)),
		dbService.duration_minutes,
		price(priceAmount, currency(dbService.price_currency)),
		permittedAddOns,
		forms,
		serviceId(dbService.id)
	);
	if(dbService.requires_time_slot) {
		theService = serviceFns.setStartTimes(theService, timeslots);
	}
	return theService
}

export function toDomainTimeslotSpec(ts: DbTimeSlot): TimeslotSpec {
	return timeslotSpec(time24(ts.start_time_24hr), time24(ts.end_time_24hr), ts.description, id(ts.id));
}

export function toDomainBooking(b: DbBooking, timeslots: TimeslotSpec[]): Booking {
	const slot = b.time_slot_id
		? mandatory(
				timeslots.find((ts) => ts.id.value === b.time_slot_id),
				`No timeslot with id ${b.time_slot_id}`
		  )
		: exactTimeAvailability(time24(b.start_time_24hr));
	return booking(customerId(b.customer_id), serviceId(b.service_id), isoDate(b.date), slot, []);
}

export function toDomainAddOn(a: DbAddOn): DomainAddOn {
	const priceAmount = (typeof a.price === "object" && "toNumber" in a.price) ? a.price.toNumber() : a.price;
	return addOn(a.name, price(priceAmount, currency(a.price_currency)), a.expect_quantity, a.description, addOnId(a.id));
}

export function toDomainForm(f: DbForm): Form {
	return f.definition as unknown as Form;
}

export function toDomainTenantSettings(settings: DbTenantSettings): TenantSettings {
	return tenantSettings(timezone(settings.iana_timezone), settings.customer_form_id ? formId(settings.customer_form_id) : null);
}

function toDayAndTimePeriod(timeSpec: TimeSpec): DayAndTimePeriod {
	if (timeSpec._type === 'days.from.time.spec') {
		if (timeSpec.relativeTo === 'today') {
			const date = isoDateFns.addDays(isoDate(), timeSpec.days);
			return dayAndTimePeriod(date, timePeriodFns.allDay);
		}
	}
	throw new Error(`Unknown time spec ${timeSpec._type}`);
}

export function toDomainPricingRule(rule: DbPricingRule): PricingRule {
	const pricingRuleSpec = rule.definition as unknown as PricingRuleSpec;
	if (pricingRuleSpec._type === 'time.based.price.adjustment.spec') {
		return timeBasedPriceAdjustment(toDayAndTimePeriod(pricingRuleSpec.timeSpec), pricingRuleSpec.adjustment);
	}
	throw new Error(`Unknown pricing rule spec ${pricingRuleSpec._type}`);
}
