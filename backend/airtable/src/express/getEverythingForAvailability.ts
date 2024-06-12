import {
    availabilityBlock,
    Booking,
    businessConfiguration,
    BusinessConfiguration,
    Coupon,
    DayAndTimePeriod,
    dayAndTimePeriod,
    dayAndTimePeriodFns,
    duration,
    formId,
    isoDate,
    IsoDate,
    isoDateFns,
    mandatory,
    minutes,
    periodicStartTime,
    PricingRule,
    Resource,
    resource,
    resourceDayAvailability,
    ResourceDayAvailability,
    resourceId,
    ResourceType,
    resourceType,
    Service,
    ServiceId,
    TenantEnvironment,
    TenantSettings,
    time24,
    timePeriod,
    values
} from '@breezbook/packages-core';
import {makeBusinessAvailability} from './makeBusinessAvailability.js';
import {
    DbAddOn,
    DbBlockedTime,
    DbBooking,
    DbBusinessHours,
    DbCoupon,
    DbForm,
    DbPricingRule,
    DbResource,
    DbResourceAvailability,
    DbResourceBlockedTime,
    DbResourceType,
    DbService,
    DbServiceForm,
    DbServiceResourceRequirement,
    DbTenantSettings,
    DbTimeSlot,
    findManyForTenant
} from '../prisma/dbtypes.js';
import {
    toDomainAddOn,
    toDomainBooking,
    toDomainForm,
    toDomainPricingRule,
    toDomainService,
    toDomainTenantSettings,
    toDomainTimeslotSpec
} from '../prisma/dbToDomain.js';
import {PrismaClient} from "@prisma/client";

export interface EverythingForAvailability {
    _type: 'everything.for.availability';
    businessConfiguration: BusinessConfiguration;
    pricingRules: PricingRule[];
    bookings: Booking[];
    coupons: Coupon[];
    tenantSettings: TenantSettings;
    tenantEnvironment: TenantEnvironment;
}

export function everythingForAvailability(
    businessConfiguration: BusinessConfiguration,
    pricingRules: PricingRule[],
    bookings: Booking[],
    coupons: Coupon[],
    tenantSettings: TenantSettings,
    tenantEnvironment: TenantEnvironment
): EverythingForAvailability {
    return {
        _type: 'everything.for.availability',
        businessConfiguration,
        pricingRules,
        bookings,
        coupons,
        tenantSettings,
        tenantEnvironment
    };
}

export const everythingForAvailabilityFns = {

    findService(everythingForAvailability: EverythingForAvailability, serviceId: ServiceId): Service {
        return mandatory(
            everythingForAvailability.businessConfiguration.services.find((s) => values.isEqual(s.id, serviceId)),
            `Service with id ${serviceId.value} not found`
        );
    }
}

interface FlattenedResourceDayAvailability {
    resource: Resource;
    availability: DayAndTimePeriod;
}

function flattenedResourceDayAvailability(resource: Resource, availability: DayAndTimePeriod): FlattenedResourceDayAvailability {
    return {
        resource,
        availability
    };
}

function resourceAvailabilityForDate(
    date: IsoDate,
    resources: Resource[],
    dbResourceAvailabilities: DbResourceAvailability[]
): FlattenedResourceDayAvailability[] {
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
    mappedResourceTypes: ResourceType[],
    resources: DbResource[],
    resourceAvailabilities: DbResourceAvailability[],
    resourceOutage: DbResourceBlockedTime[],
    dates: IsoDate[]
): ResourceDayAvailability[] {
    const mappedResources = resources.map((r) =>
        resource(
            mandatory(
                mappedResourceTypes.find((rt) => rt.value === r.resource_type),
                `No resource type ${r.resource_type}`
            ),
            r.name,
            resourceId(r.id)
        )
    );
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
            return newPeriods.map((period) => flattenedResourceDayAvailability(avail.resource, period));
        });
    });
    return availability.reduce((acc, curr) => {
        const existing = acc.find((a) => values.isEqual(a.resource.id, curr.resource.id));
        if (existing) {
            existing.availability.push(availabilityBlock(curr.availability));
            return acc;
        }
        return [...acc, resourceDayAvailability(curr.resource, [availabilityBlock(curr.availability)])];
    }, [] as ResourceDayAvailability[]);
}

export interface AvailabilityData {
    businessHours: DbBusinessHours[];
    blockedTime: DbBlockedTime[];
    resources: DbResource[];
    resourceAvailability: DbResourceAvailability[];
    resourceOutage: DbResourceBlockedTime[];
    services: DbService[];
    serviceResourceRequirements: DbServiceResourceRequirement[]
    timeSlots: DbTimeSlot[];
    pricingRules: DbPricingRule[];
    resourceTypes: DbResourceType[];
    addOns: DbAddOn[];
    serviceForms: DbServiceForm[];
    bookings: DbBooking[];
    forms: DbForm[];
    tenantSettings: DbTenantSettings;
    coupons: DbCoupon[];
}

export async function gatherAvailabilityData(prisma: PrismaClient, tenantEnvironment: TenantEnvironment, fromDate: IsoDate, toDate: IsoDate): Promise<AvailabilityData> {
    const findMany = findManyForTenant(tenantEnvironment);
    const tenant_id = tenantEnvironment.tenantId.value;
    const environment_id = tenantEnvironment.environmentId.value;
    const dateWhereOpts = {date: {gte: fromDate.value, lte: toDate.value}};
    const businessHours = await findMany(prisma.business_hours, {});
    const blockedTime = await findMany(prisma.blocked_time, dateWhereOpts);
    const resources = await findMany(prisma.resources, {});
    const resourceAvailability = await findMany(prisma.resource_availability, {});
    const resourceOutage = await findMany(prisma.resource_blocked_time, dateWhereOpts);
    const services = await findMany(prisma.services, {});
    const serviceResourceRequirements = await findMany(prisma.service_resource_requirements, {});
    const timeSlots = await findMany(prisma.time_slots, {});
    const pricingRules = await findMany(prisma.pricing_rules, {});
    const resourceTypes = await findMany(prisma.resource_types, {});
    const addOns = await findMany(prisma.add_on, {});
    const serviceForms = await findMany(prisma.service_forms, {}, {rank: 'asc'});
    const bookings = await findMany(prisma.bookings, dateWhereOpts);
    const forms = await findMany(prisma.forms, {});
    const tenantSettings = await prisma.tenant_settings.findFirstOrThrow({where: {tenant_id, environment_id}});
    const coupons = await findMany(prisma.coupons, {});
    return {
        businessHours,
        blockedTime,
        resources,
        resourceAvailability,
        resourceOutage,
        services,
        serviceResourceRequirements,
        timeSlots,
        pricingRules,
        resourceTypes,
        addOns,
        serviceForms,
        bookings,
        forms,
        tenantSettings,
        coupons
    };
}

export function convertAvailabilityDataIntoEverythingForAvailability(tenantEnvironment: TenantEnvironment, fromDate: IsoDate, toDate: IsoDate, availabilityData: AvailabilityData,) {
    const coupons = availabilityData.coupons.map((c) => c.definition as unknown as Coupon);

    const dates = isoDateFns.listDays(fromDate, toDate);
    const mappedResourceTypes = availabilityData.resourceTypes.map((rt) => resourceType(rt.id));
    const mappedAddOns = availabilityData.addOns.map((a) => toDomainAddOn(a));
    const mappedForms = availabilityData.forms.map((f) => toDomainForm(f));
    const customerFormId = availabilityData.tenantSettings.customer_form_id;
    const customerForm = customerFormId
        ? mandatory(
            mappedForms.find((f) => values.isEqual(f.id, formId(customerFormId))),
            `No customer form ${availabilityData.tenantSettings.customer_form_id}, options are ${mappedForms.map(f => f.id.value).join(",")}`
        )
        : undefined;
    const mappedTimeSlots = availabilityData.timeSlots.map(toDomainTimeslotSpec);
    const services = availabilityData.services.map((s) => toDomainService(s, mappedResourceTypes, availabilityData.serviceForms, mappedTimeSlots, availabilityData.serviceResourceRequirements))

    return everythingForAvailability(
        businessConfiguration(
            makeBusinessAvailability(availabilityData.businessHours, availabilityData.blockedTime, dates),
            makeResourceAvailability(mappedResourceTypes, availabilityData.resources, availabilityData.resourceAvailability, availabilityData.resourceOutage, dates),
            services,
            mappedAddOns,
            mappedTimeSlots,
            mappedForms,
            periodicStartTime(duration(minutes(30))),
            customerForm ? customerForm.id : null
        ),
        availabilityData.pricingRules.map((pr) => toDomainPricingRule(pr)),
        availabilityData.bookings.map((b) => toDomainBooking(b, mappedTimeSlots, services)),
        coupons,
        toDomainTenantSettings(availabilityData.tenantSettings),
        tenantEnvironment
    );
}

export async function getEverythingForAvailability(prisma: PrismaClient, tenantEnvironment: TenantEnvironment, fromDate: IsoDate, toDate: IsoDate): Promise<EverythingForAvailability> {
    const availabilityData = await gatherAvailabilityData(prisma, tenantEnvironment, fromDate, toDate);
    return convertAvailabilityDataIntoEverythingForAvailability(tenantEnvironment, fromDate, toDate, availabilityData);
}
