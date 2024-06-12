import {beforeEach, describe, expect, test} from "vitest";
import {PrismockClient} from "prismock";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";
import {listResourcesByType} from "../../src/express/resources/resourcesHandler.js";
import {EndpointDependencies, specifiedDeps} from "../../src/infra/endpoint.js";
import {
    environmentId,
    isoDate,
    locationId,
    mandatory,
    resourceId,
    resourceType,
    serviceId,
    tenantEnvironmentLocation,
    tenantId
} from "@breezbook/packages-core";
import {ResourceSummary} from "../../src/core/resources/resources.js";
import {expectJson} from "../helper.js";
import {AnySuitableResource, AvailabilityResponse, Tenant} from "@breezbook/backend-api-types";
import {
    getServiceAvailabilityForLocation,
    ServiceAvailabilityRequest
} from "../../src/express/availability/getServiceAvailabilityForLocation.js";
import {getTenant} from "../../src/express/tenants/tenantHandlers.js";

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
        const theTenant = expectJson<Tenant>(await getTenant(deps, env, tenant.value))
        const personalTrainingService = mandatory(theTenant.services.find(s => s.id === multiLocationGym.pt1Hr), `Service ${multiLocationGym.pt1Hr} not found in ${JSON.stringify(theTenant.services)}`)
        expect(personalTrainingService.resourceRequirements).toHaveLength(1)
        const personalTrainerRequirement = personalTrainingService.resourceRequirements[0] as AnySuitableResource
        const listOfPersonalTrainers = expectJson<ResourceSummary[]>(await listResourcesByType(deps, tenantEnvLoc, personalTrainer))
        const ptMike = mandatory(listOfPersonalTrainers.find(pt => pt.name === 'ptMike'), `ptMike not found in ${JSON.stringify(listOfPersonalTrainers)}`)
        // Mike is not in Harlow on Saturday
        const requestForMikeOnSaturday:ServiceAvailabilityRequest = {
            serviceId: personalTraining,
            fromDate: isoDate('2024-06-15'),
            toDate: isoDate('2024-06-15'),
            requirementOverrides: [{
                requirementId: personalTrainerRequirement.id,
                resourceId: resourceId(ptMike.id)
            }]
        }
        const mikesAvailabilityOnSaturday = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocation(deps, tenantEnvLoc, requestForMikeOnSaturday))
        expect(mikesAvailabilityOnSaturday.slots['2024-06-15']).toBeUndefined()

        const requestForMikeOnFriday:ServiceAvailabilityRequest = {
            serviceId: personalTraining,
            fromDate: isoDate('2024-06-14'),
            toDate: isoDate('2024-06-14'),
            requirementOverrides: [{
                requirementId: personalTrainerRequirement.id,
                resourceId: resourceId(ptMike.id)
            }]
        }
        const mikeOnFriday = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocation(deps, tenantEnvLoc, requestForMikeOnFriday))
        expect(mikeOnFriday.slots['2024-06-14']).toHaveLength(17)
        console.log(ptMike)
    });
})