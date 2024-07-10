import {
    DbAddOn,
    DbForm,
    DbPricingRule,
    DbResource,
    DbService,
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
} from "../express/getEverythingForAvailability.js";
import {PricingRule} from "@breezbook/packages-pricing";
import {
    addOnId,
    byId,
    capacity,
    duration,
    Form,
    formId,
    id,
    isoDate,
    minutes,
    resourceId,
    resourceRequirementId,
    ResourceType,
    resourceTypeFns,
    serviceId, serviceOptionId,
    time24,
    timePeriod,
    timezone
} from "@breezbook/packages-types";
import {resourcing} from "@breezbook/packages-resourcing";
import ResourceRequirement = resourcing.ResourceRequirement;
import specificResource = resourcing.specificResource;
import anySuitableResource = resourcing.anySuitableResource;
import resource = resourcing.resource;
import Resource = resourcing.Resource;
import resourceAllocationRules = resourcing.resourceAllocationRules;

function toDomainResourceRequirement(rr: DbServiceResourceRequirement | DbServiceOptionResourceRequirement, resourceTypes: ResourceType[], mappedResources: Resource[]): ResourceRequirement {
    if (rr.requirement_type === 'specific_resource') {
        return specificResource(byId.find(mappedResources, resourceId(rr.id)), resourceRequirementId(rr.id))
    } else {
        return anySuitableResource(resourceTypeFns.findByValue(resourceTypes, mandatory(rr.resource_type, `No resource type`)), resourceAllocationRules.any, resourceRequirementId(rr.id))
    }
}

export function toDomainServiceOption(so: DbServiceOptionFormsAndResources, resourceTypes: ResourceType[], mappedResources: Resource[]): ServiceOption {
    const mappedResourceRequirements = so.service_option_resource_requirements.map(rr => toDomainResourceRequirement(rr, resourceTypes, mappedResources));
    const priceAmount = (typeof so.price === "object" && "toNumber" in so.price) ? so.price.toNumber() : so.price;
    const formIds = so.service_option_forms.map(f => formId(f.form_id));
    return serviceOption(
        price(priceAmount, currency(so.price_currency)),
        so.requires_quantity,
        duration(minutes(so.duration_minutes)),
        mappedResourceRequirements,
        formIds,
        serviceOptionId(so.id));
}

export function toDomainService(dbService: DbService, resourceTypes: ResourceType[], dbServiceForms: DbServiceForm[], timeslots: TimeslotSpec[], resourceRequirements: DbServiceResourceRequirement[], mappedResources: Resource[]): DomainService {
    const mappedResourceRequirements = resourceRequirements.filter(rr => rr.service_id === dbService.id).map(rr => toDomainResourceRequirement(rr, resourceTypes, mappedResources));
    const permittedAddOns = dbService.permitted_add_on_ids.map((id) => addOnId(id));
    const forms = dbServiceForms.filter((sf) => sf.service_id === dbService.id).map((sf) => formId(sf.form_id));
    const priceAmount = (typeof dbService.price === "object" && "toNumber" in dbService.price) ? dbService.price.toNumber() : dbService.price;
    let theService = service(
        mappedResourceRequirements,
        minutes(dbService.duration_minutes),
        price(priceAmount, currency(dbService.price_currency)),
        permittedAddOns,
        forms,
        capacity(dbService.capacity),
        serviceId(dbService.id)
    );
    if (dbService.requires_time_slot) {
        theService = serviceFns.setStartTimes(theService, timeslots);
    }
    return theService
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
        return []
    });
    const domainBooking = booking(customerId(b.customer_id), service, isoDate(b.date), timePeriod(time24(b.start_time_24hr), time24(b.end_time_24hr)), capacity(1), fixedResourceAllocations);
    if (b.status === 'cancelled') {
        return bookingFns.cancel(domainBooking);
    }
    return domainBooking;
}

export function toDomainAddOn(a: DbAddOn): DomainAddOn {
    const priceAmount = (typeof a.price === "object" && "toNumber" in a.price) ? a.price.toNumber() : a.price;
    return addOn(price(priceAmount, currency(a.price_currency)), a.expect_quantity, addOnId(a.id));
}

export function toDomainForm(f: DbForm): Form {
    const form = f.definition as unknown as Form;
    if (form._type === "json.schema.form") {
        return {...form, id: formId(f.id)}
    }
    throw new Error(`Unknown form type`)
}

export function toDomainTenantSettings(settings: DbTenantSettings): TenantSettings {
    return tenantSettings(timezone(settings.iana_timezone), settings.customer_form_id ? formId(settings.customer_form_id) : null);
}

export function toDomainPricingRule(rule: DbPricingRule): PricingRule {
    return rule.definition as unknown as PricingRule;
}

export function toDomainResource(r: DbResource, resourceTypes: ResourceType[]): Resource {
    return resource(resourceTypeFns.findByValue(resourceTypes, r.resource_type), [], r.metadata as any ?? {}, resourceId(r.id))
}