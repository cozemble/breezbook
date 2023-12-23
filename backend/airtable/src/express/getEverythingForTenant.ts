import {
    addOn,
    AddOn as DomainAddOn,
    addOnId,
    Booking,
    businessAvailability,
    BusinessAvailability,
    businessConfiguration,
    BusinessConfiguration,
    currency,
    DayAndTimePeriod,
    dayAndTimePeriod,
    dayAndTimePeriodFns,
    duration,
    Form,
    formId,
    FungibleResource,
    isoDate,
    IsoDate,
    isoDateFns,
    periodicStartTime,
    price,
    resource,
    resourceDayAvailability,
    ResourceDayAvailability,
    resourceId,
    ResourceType,
    resourceType,
    service,
    Service as DomainService,
    serviceId,
    TenantId,
    time24,
    timePeriod,
    timeslotSpec,
    values
} from "../types.js";
import {PricingRule} from "../calculatePrice.js";
import {
    AddOn,
    BlockedTime,
    Bookings,
    BusinessHours,
    Forms,
    PricingRules,
    ResourceAvailability,
    ResourceBlockedTime,
    Resources,
    ResourceTypes,
    Services,
    TimeSlots
} from "../generated/dbtypes.js";
import {mandatory} from "../utils.js";
import pg from "pg";

export interface EverythingForTenant {
    _type: 'everything.for.tenant'
    businessConfiguration: BusinessConfiguration
    pricingRules: PricingRule[]
    bookings: Booking[]
}

export function everythingForTenant(businessConfiguration: BusinessConfiguration, pricingRules: PricingRule[], bookings: Booking[]): EverythingForTenant {
    return {
        _type: 'everything.for.tenant',
        businessConfiguration,
        pricingRules,
        bookings
    }
}

function availabilityForDate(businessHours: BusinessHours[], date: IsoDate): DayAndTimePeriod[] {
    const dayOfWeek = isoDateFns.dayOfWeek(date);
    const relevantBusinessHours = businessHours.filter(bh => bh.day_of_week === dayOfWeek);
    return relevantBusinessHours.map(bh => dayAndTimePeriod(date, timePeriod(time24(bh.start_time_24hr), time24(bh.end_time_24hr))));
}

export function makeBusinessAvailability(businessHours: BusinessHours[], blockedTime: BlockedTime[], dates: IsoDate[]): BusinessAvailability {
    let availability = dates.flatMap(date => availabilityForDate(businessHours, date));
    availability = availability.flatMap(avail => {
        const applicableBlocks = blockedTime.filter(bt => dayAndTimePeriodFns.intersects(avail, dayAndTimePeriod(isoDate(bt.date), timePeriod(time24(bt.start_time_24hr), time24(bt.end_time_24hr)))));
        if (applicableBlocks.length === 0) {
            return [avail];
        }
        return applicableBlocks.flatMap(block => dayAndTimePeriodFns.splitPeriod(avail, dayAndTimePeriod(isoDate(block.date), timePeriod(time24(block.start_time_24hr), time24(block.end_time_24hr)))))
    })
    return businessAvailability(availability);
}

interface FlattenedResourceDayAvailability {
    resource: FungibleResource
    availability: DayAndTimePeriod
}

function flattenedResourceDayAvailability(resource: FungibleResource, availability: DayAndTimePeriod): FlattenedResourceDayAvailability {
    return {
        resource,
        availability
    }
}

function resourceAvailabilityForDate(date: IsoDate, resources: FungibleResource[], dbResourceAvailabilities: ResourceAvailability[]): FlattenedResourceDayAvailability[] {
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
            }
        })
    })
}

export function makeResourceAvailability(mappedResourceTypes: ResourceType[], resources: Resources[], resourceAvailabilities: ResourceAvailability[], resourceOutage: ResourceBlockedTime[], dates: IsoDate[]): ResourceDayAvailability[] {
    const mappedResources = resources.map(r => resource(mandatory(mappedResourceTypes.find(rt => rt.value === r.resource_type), `No resource type ${r.resource_type}`), r.name, resourceId(r.id)));
    let availability = dates.flatMap(date => resourceAvailabilityForDate(date, mappedResources, resourceAvailabilities))
    availability = availability.flatMap(avail => {
        const outages = resourceOutage.filter(ro => ro.resource_id === avail.resource.id.value && isoDateFns.sameDay(isoDate(ro.date), avail.availability.day));
        if (outages.length === 0) {
            return [avail];
        }
        return outages.flatMap(outage => {
            const newPeriods = dayAndTimePeriodFns.splitPeriod(avail.availability, dayAndTimePeriod(isoDate(outage.date), timePeriod(time24(outage.start_time_24hr), time24(outage.end_time_24hr))));
            return newPeriods.map(period => flattenedResourceDayAvailability(avail.resource, period))
        })
    })
    return availability.reduce((acc, curr) => {
        const existing = acc.find(a => values.isEqual(a.resource.id, curr.resource.id));
        if (existing) {
            existing.availability.push(curr.availability);
            return acc;
        }
        return [...acc, resourceDayAvailability(curr.resource, [curr.availability])]
    }, [] as ResourceDayAvailability[])
}

function toDomainService(s: Services, resourceTypes: ResourceType[]): DomainService {
    const mappedResourceTypes = s.resource_types_required.map(rt => mandatory(resourceTypes.find(rtt => rtt.value === rt), `No resource type ${rt}`));
    const permittedAddOns = s.permitted_add_on_ids.map(id => addOnId(id));
    const result = service(s.name, s.description, mappedResourceTypes, s.duration_minutes, s.requires_time_slot, price(s.price, currency(s.price_currency)), permittedAddOns, serviceId(s.id))
    result.serviceFormId = s.form_id ? formId(s.form_id) : undefined;
    result.customerFormId = s.customer_form_id ? formId(s.customer_form_id) : undefined;
    return result
}

function toDomainBooking(b: Bookings): Booking {
    return b.definition as Booking;
}

function toDomainAddOn(a: AddOn): DomainAddOn {
    return addOn(a.name, price(a.price, currency(a.price_currency)), a.expect_quantity, addOnId(a.id));
}

function toDomainForm(f: Forms): Form {
    return f.definition as Form;
}

export async function getEverythingForTenant(client: pg.PoolClient, tenantId: TenantId, fromDate: IsoDate, toDate: IsoDate): Promise<EverythingForTenant> {
    const businessHours = await client.query(`select *
                                              from business_hours
                                              where tenant_id = $1`, [tenantId.value]).then(r => r.rows) as BusinessHours[]
    const blockedTime = await client.query(`select *
                                            from blocked_time
                                            where tenant_id = $1
                                              and date >= $2
                                              and date <= $3`, [tenantId.value, fromDate.value, toDate.value]).then(r => r.rows) as BlockedTime[]
    const resources = await client.query(`select *
                                          from resources
                                          where tenant_id = $1`, [tenantId.value]).then(r => r.rows) as Resources[]
    const resourceAvailability = await client.query(`select *
                                                     from resource_availability
                                                     where tenant_id = $1`, [tenantId.value]).then(r => r.rows) as ResourceAvailability[]
    const resourceOutage = await client.query(`select *
                                               from resource_blocked_time
                                               where tenant_id = $1
                                                 and date >= $2
                                                 and date <= $3`, [tenantId.value, fromDate.value, toDate.value]).then(r => r.rows) as ResourceBlockedTime[]
    const services = await client.query(`select *
                                         from services
                                         where tenant_id = $1`, [tenantId.value]).then(r => r.rows) as Services[]
    const timeSlots = await client.query(`select *
                                          from time_slots
                                          where tenant_id = $1`, [tenantId.value]).then(r => r.rows) as TimeSlots[]
    const pricingRules = await client.query(`select *
                                             from pricing_rules
                                             where tenant_id = $1`, [tenantId.value]).then(r => r.rows) as PricingRules[]
    const resourceTypes = await client.query(`select *
                                              from resource_types
                                              where tenant_id = $1`, [tenantId.value]).then(r => r.rows) as ResourceTypes[]

    const addOns = await client.query(`select *
                                       from add_on
                                       where tenant_id = $1`, [tenantId.value]).then(r => r.rows) as AddOn[];

    const bookings = await client.query(`select *
                                         from bookings
                                         where tenant_id = $1
                                           and date >= $2
                                           and date <= $3`, [tenantId.value, fromDate.value, toDate.value]).then(r => r.rows) as Bookings[]

    const forms = await client.query(`select *
                                      from forms
                                      where tenant_id = $1`, [tenantId.value]).then(r => r.rows) as Forms[]


    const dates = isoDateFns.listDays(fromDate, toDate);
    const mappedResourceTypes = resourceTypes.map(rt => resourceType(rt.id));
    const mappedAddOns = addOns.map(a => toDomainAddOn(a));
    const mappedForms = forms.map(f => toDomainForm(f));

    return everythingForTenant(businessConfiguration(
        makeBusinessAvailability(businessHours, blockedTime, dates),
        makeResourceAvailability(mappedResourceTypes, resources, resourceAvailability, resourceOutage, dates),
        services.map(s => toDomainService(s, mappedResourceTypes)),
        mappedAddOns,
        timeSlots.map(ts => timeslotSpec(time24(ts.start_time_24hr), time24(ts.end_time_24hr), ts.description)),
        mappedForms,
        periodicStartTime(duration(30))
    ), pricingRules.map(pr => pr.definition) as PricingRule[], bookings.map(b => toDomainBooking(b)))
}