import {beforeEach, describe, expect, test} from "vitest";
import {PrismockClient} from 'prismock';
import {PrismaClient} from "@prisma/client";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";
import {
    carwash,
    environmentId,
    isoDate,
    locationId,
    mandatory,
    tenantEnvironmentLocation,
    tenantId
} from "@breezbook/packages-core";
import {v4 as uuid} from 'uuid';
import {byLocation} from "../../src/availability/byLocation.js";
import {loadTestCarWashTenant} from "../../src/dx/loadTestCarWashTenant.js";
import {getAvailabilityForService} from "../../src/core/getAvailabilityForService.js";

const tenant = tenantId(multiLocationGym.tenant_id)
const env = environmentId(multiLocationGym.environment_id)
const harlow = tenantEnvironmentLocation(env, tenant, locationId(multiLocationGym.locationHarlow))
const stortford = tenantEnvironmentLocation(env, tenant, locationId(multiLocationGym.locationStortford))
const ware = tenantEnvironmentLocation(env, tenant, locationId(multiLocationGym.locationWare))

describe("Given a gym with services at various locations", () => {
    let prisma: PrismaClient;

    beforeEach(async () => {
        prisma = new PrismockClient()
        await loadMultiLocationGymTenant(prisma)
    })

    test("harlow has gym, pt and massage as possible services", async () => {
        const location = mandatory(await byLocation.findServices(prisma, harlow), `harlow services`)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.pt1Hr, multiLocationGym.massage30mins])
    })

    test("ware has gym, pt and swim as possible services", async () => {
        const location = mandatory(await byLocation.findServices(prisma, ware), `ware services`)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.pt1Hr, multiLocationGym.swim30mins])
    });

    test("stortford has gym, yoga and swim as possible services", async () => {
        const location = mandatory(await byLocation.findServices(prisma, stortford), `stortford services`)
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

    test("ptMike is at harlow mon-friday, and ptMete is there on tue and sat", async () => {
        const everythingHarlow = await byLocation.getEverythingForAvailability(prisma, harlow, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const ptMikeDays = everythingHarlow.businessConfiguration.resourceAvailability.filter(ra => ra.resource.id.value === multiLocationGym.ptMike).flatMap(ra => ra.availability.map(a => a.when.day.value))
        expect(ptMikeDays).toEqual(['2024-04-22', '2024-04-23', '2024-04-24', '2024-04-25', '2024-04-26'])
        const ptMeteDays = everythingHarlow.businessConfiguration.resourceAvailability.filter(ra => ra.resource.id.value === multiLocationGym.ptMete).flatMap(ra => ra.availability.map(a => a.when.day.value))
        expect(ptMeteDays).toEqual(['2024-04-20', '2024-04-23', '2024-04-27'])
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
        const ptMikeDays = everythingHarlow.businessConfiguration.resourceAvailability.filter(ra => ra.resource.id.value === multiLocationGym.ptMike).flatMap(ra => ra.availability.map(a => a.when.day.value))
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
                customer_id: 'customer1',
                order_line_id: 'orderLine1'
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
                customer_id: 'customer1',
                order_line_id: 'orderLine2'
            }]
        });
        const everythingHarlow = await byLocation.getEverythingForAvailability(prisma, harlow, isoDate('2024-04-20'), isoDate('2024-04-27'));
        expect(everythingHarlow.bookings).toHaveLength(1)
    });
})

describe("Given the test car wash tenant", async () => {
    const tenant = tenantId('tenant1')
    const env = environmentId("dev")
    const london = tenantEnvironmentLocation(env, tenant, carwash.locations.london);

    let prisma: PrismaClient;

    beforeEach(async () => {
        prisma = new PrismockClient()
        await loadTestCarWashTenant(prisma)
    })

    test("there are two forms, one for customer details and another for service details", async () => {
        const everythingLondon = await byLocation.getEverythingForAvailability(prisma, london, isoDate('2024-04-20'), isoDate('2024-04-27'));
        expect(everythingLondon.businessConfiguration.forms).toHaveLength(2)
        const customerForm = everythingLondon.businessConfiguration.forms.find(f => f.id.value === everythingLondon.tenantSettings.customerFormId?.value)
        expect(customerForm).toBeDefined()
        const availability = getAvailabilityForService(everythingLondon, carwash.smallCarWash.id, isoDate('2024-04-20'), isoDate('2024-04-27'))
    });
});

