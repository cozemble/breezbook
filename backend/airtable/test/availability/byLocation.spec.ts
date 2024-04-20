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
    DbBusinessHours,
    DbLocation,
    DbService,
    DbServiceLocation,
    findManyForTenant
} from "../../src/prisma/dbtypes.js";
import {
    AvailabilityData,
    convertAvailabilityDataIntoEverythingForAvailability,
    EverythingForAvailability
} from "../../src/express/getEverythingForAvailability.js";

const tenant = tenantId(multiLocationGym.tenant_id)
const env = environmentId(multiLocationGym.environment_id)
const harlow = tenantEnvironmentLocation(env, tenant, locationId(multiLocationGym.locationHarlow))
const stortford = tenantEnvironmentLocation(env, tenant, locationId(multiLocationGym.locationStortford))
const ware = tenantEnvironmentLocation(env, tenant, locationId(multiLocationGym.locationWare))

export type LocationAndServices = DbLocation & {
    service_locations: (DbServiceLocation & {
        service: DbService
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
                id: location.location.value
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
                        location_id: location.location.value
                    }, {
                        location_id: null
                    }]
            }
        })
        if (hours.some(h => h.location_id === location.location.value)) {
            return hours.filter(h => h.location_id === location.location.value)
        }
        return hours

    },

    async gatherAvailabilityData(prisma: PrismaClient, location: TenantEnvironmentLocation, fromDate: IsoDate, toDate: IsoDate): Promise<AvailabilityData> {
        const tenantEnv = tenantEnvironment(location.environmentId, location.tenantId)
        const services = await byLocation.findServices(prisma, location).then(l => l.service_locations.map(s => s.services)) as DbService[]
        const findMany = findManyForTenant(tenantEnv);
        const resourceTypes = await findMany(prisma.resource_types, {});
        const businessHours = await byLocation.findBusinessHours(prisma, location);


        return {
            businessHours,
            blockedTime: [],
            resources: [],
            resourceAvailability: [],
            resourceOutage: [],
            services,
            timeSlots: [],
            pricingRules: [],
            resourceTypes,
            addOns: [],
            serviceForms: [],
            bookings: [],
            forms: [],
            tenantSettings: {
                iana_timezone: 'Europe/London',
                customer_form_id: null,
                tenant_id: location.tenantId.value,
                environment_id: location.environmentId.value,
                created_at: new Date(),
                updated_at: new Date(),
            },
            coupons: []
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

})