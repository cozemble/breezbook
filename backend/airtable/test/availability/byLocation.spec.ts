import {beforeEach, describe, expect, test} from "vitest";
import {PrismockClient} from 'prismock';
import {PrismaClient} from "@prisma/client";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";
import {
    environmentId,
    IsoDate,
    isoDate,
    locationId,
    tenantEnvironment,
    TenantEnvironmentLocation,
    tenantEnvironmentLocation,
    tenantId
} from "@breezbook/packages-core";
import {
    DbBlockedTime,
    DbBusinessHours,
    DbLocation,
    DbResourceAvailability,
    DbService,
    DbServiceLocation,
    findManyForTenant
} from "../../src/prisma/dbtypes.js";
import {
    AvailabilityData,
    convertAvailabilityDataIntoEverythingForAvailability,
    EverythingForAvailability
} from "../../src/express/getEverythingForAvailability.js";
import {v4 as uuid} from 'uuid';

const tenant = tenantId(multiLocationGym.tenant_id)
const env = environmentId(multiLocationGym.environment_id)
const harlow = tenantEnvironmentLocation(env, tenant, locationId(multiLocationGym.locationHarlow))
const stortford = tenantEnvironmentLocation(env, tenant, locationId(multiLocationGym.locationStortford))
const ware = tenantEnvironmentLocation(env, tenant, locationId(multiLocationGym.locationWare))

export type LocationAndServices = DbLocation & {
    service_locations: (DbServiceLocation & {
        services: DbService
    })[]
}

export const byLocation = {
    async findServices(
        prisma: PrismaClient,
        location: TenantEnvironmentLocation
    ): Promise<LocationAndServices> {
        return await prisma.locations.findFirst({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                id: location.locationId.value
            },
            include: {
                service_locations: {
                    include: {services: true}
                },
            }
        });
    },
    async findBusinessHours(prisma: PrismaClient,
                            location: TenantEnvironmentLocation): Promise<DbBusinessHours[]> {
        const hours = await prisma.business_hours.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                OR: [
                    {
                        location_id: location.locationId.value
                    }, {
                        location_id: null
                    }]
            }
        })
        if (hours.some(h => h.location_id === location.locationId.value)) {
            return hours.filter(h => h.location_id === location.locationId.value)
        }
        return hours

    },
    async findBlockedime(prisma: PrismaClient, location: TenantEnvironmentLocation, fromDate: IsoDate, toDate: IsoDate): Promise<DbBlockedTime[]> {
        return await prisma.blocked_time.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                date: {
                    gte: fromDate.value,
                    lte: toDate.value
                },
                OR: [
                    {
                        location_id: location.locationId.value
                    }, {
                        location_id: null
                    }]

            }
        })
    },

    async findResourceAvailability(prisma: PrismaClient, location: TenantEnvironmentLocation): Promise<DbResourceAvailability[]> {
        return await prisma.resource_availability.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                OR: [
                    {
                        location_id: location.locationId.value
                    }, {
                        location_id: null
                    }]
            }
        })
    },

    async gatherAvailabilityData(prisma: PrismaClient, location: TenantEnvironmentLocation, fromDate: IsoDate, toDate: IsoDate): Promise<AvailabilityData> {
        const tenantEnv = tenantEnvironment(location.environmentId, location.tenantId)
        const dateWhereOpts = {date: {gte: fromDate.value, lte: toDate.value}};

        const services = await byLocation.findServices(prisma, location).then(l => l.service_locations.map(s => s.services))
        const findMany = findManyForTenant(tenantEnv);
        const resourceTypes = await findMany(prisma.resource_types, {});
        const businessHours = await byLocation.findBusinessHours(prisma, location);
        const blockedTime = await byLocation.findBlockedime(prisma, location, fromDate, toDate);
        const resources = await findMany(prisma.resources, {});
        const resourceAvailability = await byLocation.findResourceAvailability(prisma, location);
        const resourceOutage = await findMany(prisma.resource_blocked_time, dateWhereOpts)
        const timeSlots = await findMany(prisma.time_slots, {});
        const pricingRules = await findMany(prisma.pricing_rules, {});
        const addOns = await findMany(prisma.add_on, {});
        const serviceForms = await findMany(prisma.service_forms, {}, {rank: 'asc'});
        const forms = await findMany(prisma.forms, {});
        const tenantSettings = await prisma.tenant_settings.findFirstOrThrow({
            where: {
                tenant_id: tenantEnv.tenantId.value,
                environment_id: tenantEnv.environmentId.value
            }
        });
        const coupons = await findMany(prisma.coupons, {});
        const bookings = await prisma.bookings.findMany({
            where: {
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                location_id: location.locationId.value,
                ...dateWhereOpts,
            }
        });


        return {
            businessHours,
            blockedTime,
            resources,
            resourceAvailability,
            resourceOutage,
            services,
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
    },


    async getEverythingForAvailability(
        prisma: PrismaClient,
        location: TenantEnvironmentLocation,
        start: IsoDate,
        end: IsoDate
    ): Promise<EverythingForAvailability> {
        const availabilityData = await byLocation.gatherAvailabilityData(prisma, location, start, end);
        return convertAvailabilityDataIntoEverythingForAvailability(tenantEnvironment(location.environmentId, location.tenantId), start, end, availabilityData);
    }
}

describe("Given a gym with services at various locations", async () => {
    let prisma: PrismaClient;

    beforeEach(async () => {
        prisma = new PrismockClient()
        await loadMultiLocationGymTenant(prisma)
    })

    test("harlow has gym, pt and massage as possible services", async () => {
        const location = await byLocation.findServices(prisma, harlow)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.pt1Hr, multiLocationGym.massage30mins])
    })

    test("ware has gym, pt and swim as possible services", async () => {
        const location = await byLocation.findServices(prisma, ware)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.pt1Hr, multiLocationGym.swim30mins])
    });

    test("stortford has gym, yoga and swim as possible services", async () => {
        const location = await byLocation.findServices(prisma, stortford)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.yoga1Hr, multiLocationGym.swim30mins])
    })

    test("there is availability for gym, pt and massage at harlow", async () => {
        const everything = await byLocation.getEverythingForAvailability(prisma, harlow, isoDate('2024-04-22'), isoDate('2024-04-23'));
        const serviceIds = everything.businessConfiguration.services.map(s => s.id.value)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.pt1Hr, multiLocationGym.massage30mins])
    });

    test("default business hours for stortford and ware, closed on wednesdays at harlow", async () => {
        const everythingHarlow = await byLocation.getEverythingForAvailability(prisma, harlow, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const daysAtHarlow = everythingHarlow.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtHarlow).toEqual(['2024-04-20', '2024-04-21', '2024-04-22', '2024-04-23', '2024-04-25', '2024-04-26', '2024-04-27'])

        const everythingWare = await byLocation.getEverythingForAvailability(prisma, ware, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const daysAtWare = everythingWare.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtWare).toEqual(['2024-04-20', '2024-04-21', '2024-04-22', '2024-04-23', '2024-04-24', '2024-04-25', '2024-04-26', '2024-04-27'])

        const everythingStortford = await byLocation.getEverythingForAvailability(prisma, ware, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const daysAtStortford = everythingStortford.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtStortford).toEqual(['2024-04-20', '2024-04-21', '2024-04-22', '2024-04-23', '2024-04-24', '2024-04-25', '2024-04-26', '2024-04-27'])
    });

    test("everywhere is closed for christmas day, but harlow is also closed on dec 26th", async () => {
        const everythingHarlow = await byLocation.getEverythingForAvailability(prisma, harlow, isoDate('2024-12-24'), isoDate('2024-12-27'));
        const daysAtHarlow = everythingHarlow.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtHarlow).toEqual(['2024-12-24', '2024-12-27'])

        const everythingWare = await byLocation.getEverythingForAvailability(prisma, ware, isoDate('2024-12-24'), isoDate('2024-12-27'));
        const daysAtWare = everythingWare.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtWare).toEqual(['2024-12-24', '2024-12-26', '2024-12-27'])

        const everythingStortford = await byLocation.getEverythingForAvailability(prisma, ware, isoDate('2024-12-24'), isoDate('2024-12-27'));
        const daysAtStortford = everythingStortford.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtStortford).toEqual(['2024-12-24', '2024-12-26', '2024-12-27'])
    });

    test("ptMike is at harlow mon-friday, and ptMete is there on tue", async () => {
        const everythingHarlow = await byLocation.getEverythingForAvailability(prisma, harlow, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const ptMikeDays = everythingHarlow.businessConfiguration.resourceAvailability.filter(ra => ra.resource.id.value === multiLocationGym.ptMike).flatMap(ra => ra.availability.map(a => a.day.value))
        expect(ptMikeDays).toEqual(['2024-04-22', '2024-04-23', '2024-04-24', '2024-04-25', '2024-04-26'])
        const ptMeteDays = everythingHarlow.businessConfiguration.resourceAvailability.filter(ra => ra.resource.id.value === multiLocationGym.ptMete).flatMap(ra => ra.availability.map(a => a.day.value))
        expect(ptMeteDays).toEqual(['2024-04-23'])
    })

    test("if a resource has blocked out time, they are not available", async () => {
        await prisma.resource_blocked_time.create({
            data: {
                id: uuid(),
                tenant_id: multiLocationGym.tenant_id,
                environment_id: multiLocationGym.environment_id,
                resource_id: multiLocationGym.ptMike,
                date: '2024-04-22',
                start_time_24hr: "09:00",
                end_time_24hr: "18:00",
            }
        });
        const everythingHarlow = await byLocation.getEverythingForAvailability(prisma, harlow, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const ptMikeDays = everythingHarlow.businessConfiguration.resourceAvailability.filter(ra => ra.resource.id.value === multiLocationGym.ptMike).flatMap(ra => ra.availability.map(a => a.day.value))
        expect(ptMikeDays).toEqual(['2024-04-23', '2024-04-24', '2024-04-25', '2024-04-26'])
    });

    test("bookings are returned, but only those for the given location", async () => {
        await prisma.bookings.createMany({
            data: [{
                id: uuid(),
                tenant_id: multiLocationGym.tenant_id,
                environment_id: multiLocationGym.environment_id,
                service_id: multiLocationGym.pt1Hr,
                location_id: multiLocationGym.locationHarlow,
                add_on_ids: [],
                order_id: "order1",
                date: '2024-04-22',
                start_time_24hr: "09:00",
                end_time_24hr: "18:00",
            }, {
                id: uuid(),
                tenant_id: multiLocationGym.tenant_id,
                environment_id: multiLocationGym.environment_id,
                service_id: multiLocationGym.pt1Hr,
                location_id: multiLocationGym.locationWare,
                add_on_ids: [],
                order_id: "order1",
                date: '2024-04-22',
                start_time_24hr: "09:00",
                end_time_24hr: "18:00",
            }]
        });
        const everythingHarlow = await byLocation.getEverythingForAvailability(prisma, harlow, isoDate('2024-04-20'), isoDate('2024-04-27'));
        expect(everythingHarlow.bookings).toHaveLength(1)
    });
})

