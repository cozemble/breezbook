import {beforeEach, describe, test} from "vitest";
import {PrismockClient} from "prismock";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";
import {listResourcesByType} from "../../src/express/resources/resourcesHandler.js";
import {EndpointDependencies, specifiedDeps} from "../../src/infra/endpoint.js";
import {
    environmentId,
    isoDate,
    locationId,
    mandatory,
    resourceType,
    serviceId,
    tenantEnvironmentLocation,
    tenantId
} from "@breezbook/packages-core";
import {ResourceSummary} from "../../src/core/resources/resources.js";
import {expectJson} from "../helper.js";
import {AvailabilityResponse} from "@breezbook/backend-api-types";
import {getServiceAvailabilityForLocation} from "../../src/express/availability/getServiceAvailabilityForLocation.js";

const env = environmentId(multiLocationGym.environment_id);
const tenant = tenantId(multiLocationGym.tenant_id);
const harlow = locationId(multiLocationGym.locationHarlow)
const personalTrainer = resourceType('personal.trainer')
const tenantEnvLoc = tenantEnvironmentLocation(env, tenant, harlow);
const personalTraining = serviceId(multiLocationGym.pt1Hr)

describe("given the test gym tenant", () => {
    let deps: EndpointDependencies;

    beforeEach(async () => {
        const prisma = new PrismockClient()
        await loadMultiLocationGymTenant(prisma)
        deps = specifiedDeps(prisma)
    })

    test("endpoints support an end to end booking flow", async () => {
        const listOfPersonalTrainers = expectJson<ResourceSummary[]>(await listResourcesByType(deps, tenantEnvLoc, personalTrainer))
        const ptMike = mandatory(listOfPersonalTrainers.find(pt => pt.name === 'ptMike'), `ptMike not found in ${JSON.stringify(listOfPersonalTrainers)}`)
        const mikesAvailability = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocation(deps, tenantEnvLoc, {
            serviceId: personalTraining,
            fromDate: isoDate('2021-01-01'),
            toDate: isoDate('2021-01-02'),
            requirementOverrides: []
        }))
        console.log(ptMike)
    });
})