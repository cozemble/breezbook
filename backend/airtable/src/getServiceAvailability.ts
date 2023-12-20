import {
    BookableTimeSlots,
    businessAvailability,
    BusinessAvailability,
    businessConfiguration,
    BusinessConfiguration,
    dayAndTimePeriod,
    DayAndTimePeriod,
    dayAndTimePeriodFns,
    FungibleResource,
    IsoDate,
    isoDate,
    isoDateFns,
    resource,
    resourceDayAvailability,
    ResourceDayAvailability,
    resourceType,
    TenantId,
    tenantId,
    time24,
    timePeriod,
    timeslotSpec, values,
    Service as DomainService, service, ResourceType, price, currency, periodicStartTime, duration, resourceId, serviceId
} from "./types.js";
import express from 'express';
import {PricingRule} from "./calculatePrice.js";
import {withAdminPgClient} from "./infra/postgresPool.js";
import {
    BlockedTime,
    BusinessHours,
    PricingRules,
    ResourceAvailability,
    ResourceBlockedTime,
    Resources,
    ResourceTypes,
    Services,
    TimeSlots
} from "./generated/dbtypes.js";
import {mandatory} from "./utils.js";

const AVAILABILITY: BookableTimeSlots = {
    "date": isoDate("2023-05-24"),
    "bookableSlots": [
        timeslotSpec(time24("09:00"), time24("13:00"), "09:00 - 13:00"),
        timeslotSpec(time24("13:00"), time24("17:00"), "13:00 - 17:00")]
};

export interface EverythingForTenant {
    _type: 'everything.for.tenant'
    businessConfiguration: BusinessConfiguration
    pricingRules: PricingRule[]
}

export function everythingForTenant(businessConfiguration: BusinessConfiguration, pricingRules: PricingRule[]): EverythingForTenant {
    return {
        _type: 'everything.for.tenant',
        businessConfiguration,
        pricingRules
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

function toDomainService(s: Services, resourceTypes:ResourceType[]): DomainService {
    const mappedResourceTypes = s.resource_types_required.map(rt => mandatory(resourceTypes.find(rtt => rtt.value === rt), `No resource type ${rt}`));
    return service(s.name,mappedResourceTypes, s.duration_minutes, s.requires_time_slot,price(s.price, currency(s.price_currency)), serviceId(s.id))
}

async function getEverythingForTenant(tenantId: TenantId, fromDate: IsoDate, toDate: IsoDate): Promise<EverythingForTenant> {
    // availability: BusinessAvailability;
    // resourceAvailability: ResourceDayAvailability[];
    // services: Service[];
    // timeslots: TimeslotSpec[];
    // startTimeSpec: StartTimeSpec

    /**
     * For date range:
     * Load normal business hours
     * Load blocked off times
     * Load resources
     * Load resource availability
     * Load resource outage times
     * Load services
     * Load time slots
     * Load pricing rules
     */
    return withAdminPgClient(async (client) => {
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


        const dates = isoDateFns.listDays(fromDate, toDate);
        const mappedResourceTypes = resourceTypes.map(rt => resourceType(rt.id));

        return everythingForTenant(businessConfiguration(
            makeBusinessAvailability(businessHours, blockedTime, dates),
            makeResourceAvailability(mappedResourceTypes, resources, resourceAvailability, resourceOutage, dates),
            services.map(s => toDomainService(s, mappedResourceTypes)),
            timeSlots.map(ts => timeslotSpec(time24(ts.start_time_24hr), time24(ts.end_time_24hr), ts.description)),
            periodicStartTime(duration(30))
        ), pricingRules.map(pr => pr.definition) as PricingRule[])
    });

}

export async function getServiceAvailability(req: express.Request, res: express.Response) {
    const tenantIdValue = req.params.tenantId;
    const serviceIdValue = req.params.serviceId;
    const fromDateValue = req.query.fromDate as string;
    const toDateValue = req.query.toDate as string;
    console.log(`Getting availability for tenant ${tenantIdValue} and service ${serviceIdValue} from ${fromDateValue} to ${toDateValue}`);
    if (!tenantIdValue || !serviceIdValue || !fromDateValue || !toDateValue) {
        res.status(400).send('Missing required parameters');
        return;
    }
    const everythingForTenant = await getEverythingForTenant(tenantId(tenantIdValue), isoDate(fromDateValue), isoDate(toDateValue));
    res.send([AVAILABILITY]);
}