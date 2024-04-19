import {beforeEach, describe, expect, test} from "vitest";
import {PrismockClient} from 'prismock';
import {PrismaClient} from "@prisma/client";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";
import {
    environmentId,
    locationId,
    TenantEnvironmentLocation,
    tenantEnvironmentLocation,
    tenantId
} from "@breezbook/packages-core";
import {DbLocation, DbService, DbServiceLocation} from "../../src/prisma/dbtypes.js";

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
    }
}

describe("Given a gym with services at various locations", async () => {
    let prisma: PrismaClient;

    beforeEach(async () => {
        prisma = new PrismockClient()
        await loadMultiLocationGymTenant(prisma)
    })

    test("harlow has gym, pt and massage", async () => {
        const location = await byLocation.findServices(prisma, harlow)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.pt1Hr, multiLocationGym.massage30mins])
    })

    test("ware has gym, pt and swim", async () => {
        const location = await byLocation.findServices(prisma, ware)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.pt1Hr, multiLocationGym.swim30mins])
    });

    test("stortford has gym, yoga and swim", async () => {
        const location = await byLocation.findServices(prisma, stortford)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.yoga1Hr, multiLocationGym.swim30mins])
    })
})