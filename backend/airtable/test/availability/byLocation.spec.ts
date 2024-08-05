import {beforeEach, describe, expect, test} from "vitest";
import {PrismockClient} from 'prismock';
import {PrismaClient} from "@prisma/client";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";
import {v4 as uuid} from 'uuid';
import {byLocation} from "../../src/availability/byLocation.js";
import {dbCarwashTenant, loadTestCarWashTenant} from "../../src/dx/loadTestCarWashTenant.js";
import {environmentId, mandatory, tenantEnvironmentLocation, tenantId} from "@breezbook/packages-types";
import {serviceAvailabilityRequest} from "../../src/express/availability/getServiceAvailabilityForLocation.js";
import {AvailabilityResponse} from "@breezbook/backend-api-types";
import {getAvailabilityForService} from "../../src/availability/getAvailabilityForService.js";
import {multilocationGym} from "../helpers/fixtures.js";
import { isoDate } from '@breezbook/packages-date-time';


describe("Given a gym with services at various locations", () => {
    let prisma: PrismaClient;

    beforeEach(async () => {
        prisma = new PrismockClient()
        await loadMultiLocationGymTenant(prisma)
    })

    test("london has gym, pt and massage as possible services", async () => {
        const location = mandatory(await byLocation.findServices(prisma, multilocationGym.london), `harlow services`)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.pt1Hr, multiLocationGym.massage30mins])
    })

    test("manchester has gym, pt and swim as possible services", async () => {
        const location = mandatory(await byLocation.findServices(prisma, multilocationGym.manchester), `ware services`)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.pt1Hr, multiLocationGym.swim30mins])
    });

    test("liverpool has gym, yoga and swim as possible services", async () => {
        const location = mandatory(await byLocation.findServices(prisma, multilocationGym.liverpool), `stortford services`)
        const serviceIds = location.service_locations.map(s => s.service_id)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.yoga1Hr, multiLocationGym.swim30mins])
    })

    test("there is availability for gym, pt and massage at london", async () => {
        const everything = await byLocation.getEverythingForAvailability(prisma, multilocationGym.london, isoDate('2024-04-22'), isoDate('2024-04-23'));
        const serviceIds = everything.businessConfiguration.services.map(s => s.id.value)
        expect(serviceIds).toEqual([multiLocationGym.gym1Hr, multiLocationGym.pt1Hr, multiLocationGym.massage30mins])
    });

    test("default business hours for liverpool and manchester, closed on wednesdays at london", async () => {
        const everythingLondon = await byLocation.getEverythingForAvailability(prisma, multilocationGym.london, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const daysAtLondon = everythingLondon.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtLondon).toEqual(['2024-04-20', '2024-04-21', '2024-04-22', '2024-04-23', '2024-04-25', '2024-04-26', '2024-04-27'])

        const everythingWare = await byLocation.getEverythingForAvailability(prisma, multilocationGym.manchester, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const daysAtWare = everythingWare.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtWare).toEqual(['2024-04-20', '2024-04-21', '2024-04-22', '2024-04-23', '2024-04-24', '2024-04-25', '2024-04-26', '2024-04-27'])

        const everythingStortford = await byLocation.getEverythingForAvailability(prisma, multilocationGym.manchester, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const daysAtStortford = everythingStortford.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtStortford).toEqual(['2024-04-20', '2024-04-21', '2024-04-22', '2024-04-23', '2024-04-24', '2024-04-25', '2024-04-26', '2024-04-27'])
    });

    test("everywhere is closed for christmas day, but london is also closed on dec 26th", async () => {
        const everythingLondon = await byLocation.getEverythingForAvailability(prisma, multilocationGym.london, isoDate('2024-12-24'), isoDate('2024-12-27'));
        const daysAtLondon = everythingLondon.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtLondon).toEqual(['2024-12-24', '2024-12-27'])

        const everythingWare = await byLocation.getEverythingForAvailability(prisma, multilocationGym.manchester, isoDate('2024-12-24'), isoDate('2024-12-27'));
        const daysAtWare = everythingWare.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtWare).toEqual(['2024-12-24', '2024-12-26', '2024-12-27'])

        const everythingStortford = await byLocation.getEverythingForAvailability(prisma, multilocationGym.manchester, isoDate('2024-12-24'), isoDate('2024-12-27'));
        const daysAtStortford = everythingStortford.businessConfiguration.availability.availability.map(a => a.day.value)
        expect(daysAtStortford).toEqual(['2024-12-24', '2024-12-26', '2024-12-27'])
    });

    test("ptMike is at london mon-friday, and ptMete is there on tue and sat", async () => {
        const everythingLondon = await byLocation.getEverythingForAvailability(prisma, multilocationGym.london, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const ptMikeDays = everythingLondon.businessConfiguration.resourceAvailability.filter(ra => ra.resource.id.value === multiLocationGym.ptMike).flatMap(ra => ra.availability.map(a => a.when.day.value))
        expect(ptMikeDays).toEqual(['2024-04-22', '2024-04-23', '2024-04-24', '2024-04-25', '2024-04-26'])
        const ptMeteDays = everythingLondon.businessConfiguration.resourceAvailability.filter(ra => ra.resource.id.value === multiLocationGym.ptMete).flatMap(ra => ra.availability.map(a => a.when.day.value))
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
        const everythingLondon = await byLocation.getEverythingForAvailability(prisma, multilocationGym.london, isoDate('2024-04-20'), isoDate('2024-04-27'));
        const ptMikeDays = everythingLondon.businessConfiguration.resourceAvailability.filter(ra => ra.resource.id.value === multiLocationGym.ptMike).flatMap(ra => ra.availability.map(a => a.when.day.value))
        expect(ptMikeDays).toEqual(['2024-04-23', '2024-04-24', '2024-04-25', '2024-04-26'])
    });

    test("bookings are returned, but only those for the given location", async () => {
        await prisma.bookings.createMany({
            data: [{
                id: uuid(),
                tenant_id: multiLocationGym.tenant_id,
                environment_id: multiLocationGym.environment_id,
                service_id: multiLocationGym.pt1Hr,
                location_id: multiLocationGym.locationLondon,
                order_id: "order1",
                date: '2024-04-22',
                start_time_24hr: "09:00",
                end_time_24hr: "18:00",
                customer_id: 'customer1',
                order_line_id: 'orderLine1',
                booked_capacity: 1
            }, {
                id: uuid(),
                tenant_id: multiLocationGym.tenant_id,
                environment_id: multiLocationGym.environment_id,
                service_id: multiLocationGym.pt1Hr,
                location_id: multiLocationGym.locationManchester,
                order_id: "order1",
                date: '2024-04-22',
                start_time_24hr: "09:00",
                end_time_24hr: "18:00",
                customer_id: 'customer1',
                order_line_id: 'orderLine2',
                booked_capacity: 1
            }]
        });
        const everythingLondon = await byLocation.getEverythingForAvailability(prisma, multilocationGym.london, isoDate('2024-04-20'), isoDate('2024-04-27'));
        expect(everythingLondon.bookings).toHaveLength(1)
    });

})

describe("Given the test car wash tenant", async () => {
    const tenant = tenantId('tenant1')
    const env = environmentId("dev")
    const london = tenantEnvironmentLocation(env, tenant, dbCarwashTenant.locations.london);

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
        const availability = getAvailabilityForService(everythingLondon, serviceAvailabilityRequest(dbCarwashTenant.smallCarWash.id, isoDate('2024-04-20'), isoDate('2024-04-20'))) as AvailabilityResponse
        expect(availability).toBeDefined()
        const slotsForDate = availability.slots['2024-04-20']
        expect(slotsForDate).toBeDefined()
        const firstSlot = mandatory(slotsForDate[0], 'first slot')
        expect(firstSlot.label).toEqual('09:00 to 13:00')
        expect(firstSlot.priceBreakdown.servicePrice).toEqual(1000)

    });
});

