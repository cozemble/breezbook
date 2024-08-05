import {PrismaClient} from "@prisma/client";
import {beforeEach, describe, expect, test} from "vitest";
import {PrismockClient} from "prismock";
import {loadMultiLocationGymTenant} from "../../../src/dx/loadMultiLocationGymTenant.js";
import {listResourceAvailabilityByType} from "../../../src/express/resources/resourcesHandler.js";
import {multilocationGym} from "../../helpers/fixtures.js";
import {serviceAvailabilityRequest} from "../../../src/express/availability/getServiceAvailabilityForLocation.js";
import {isoDate} from "@breezbook/packages-date-time";
import {dummyEventSender, endpointDependencies, httpResponseOutcome} from "../../../src/infra/endpoint.js";
import {responseOf} from "@breezbook/packages-http/dist/responses.js";

describe("given a tenant with a service at one location and not another", () => {
    let prisma: PrismaClient;

    beforeEach(async () => {
        prisma = new PrismockClient()
        await loadMultiLocationGymTenant(prisma)
    })

    test("should return 404 when service is not found at location", async () => {
        const outcome = await listResourceAvailabilityByType(
            endpointDependencies(prisma, dummyEventSender()),
            multilocationGym.liverpool,
            multilocationGym.personalTrainer,
            serviceAvailabilityRequest(multilocationGym.personalTraining, isoDate('2024-08-06'), isoDate('2024-08-06')))
        expect(outcome).toEqual([httpResponseOutcome(responseOf(404, JSON.stringify({error: "No service found with id 'breezbook-gym_dev_pt.service.1hr'"}), ['Content-Type', 'application/json']))])
    })
})