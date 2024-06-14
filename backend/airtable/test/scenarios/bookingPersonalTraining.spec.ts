import {beforeEach, describe, expect, test} from "vitest";
import {PrismockClient} from "prismock";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";
import {EndpointDependencies, specifiedDeps} from "../../src/infra/endpoint.js";
import {
    environmentId,
    isoDate,
    locationId,
    mandatory,
    resourceType,
    serviceId,
    tenantId
} from "@breezbook/packages-core";
import {ResourceSummary} from "../../src/core/resources/resources.js";
import {expectJson} from "../helper.js";
import {AvailabilityResponse, Service, Tenant, unpricedBasket, unpricedBasketLine} from "@breezbook/backend-api-types";
import {
    getServiceAvailabilityForLocationEndpoint
} from "../../src/express/availability/getServiceAvailabilityForLocation.js";
import {requestOf} from "@http4t/core/requests.js";
import {externalApiPaths} from "../../src/express/expressApp.js";
import {requestContext} from "../../src/infra/http/expressHttp4t.js";
import {onGetTenantRequestEndpoint} from "../../src/express/tenants/tenantHandlers.js";
import {listResourcesByTypeRequestEndpoint} from "../../src/express/resources/resourcesHandler.js";

const env = environmentId(multiLocationGym.environment_id);
const tenant = tenantId(multiLocationGym.tenant_id);
const harlow = locationId(multiLocationGym.locationHarlow)
const personalTrainer = resourceType('personal.trainer')
const personalTraining = serviceId(multiLocationGym.pt1Hr)
const friday = isoDate('2024-06-14')
const saturday = isoDate('2024-06-15')

describe("given the test gym tenant", () => {
    let deps: EndpointDependencies;

    beforeEach(async () => {
        const prisma = new PrismockClient()
        await loadMultiLocationGymTenant(prisma)
        deps = specifiedDeps(prisma)
    })

    test("endpoints support an end to end booking flow", async () => {
        const params = {
            'envId': env.value,
            'tenantId': tenant.value,
            'serviceId': personalTraining.value,
            locationId: harlow.value
        }
        const theTenant = expectJson<Tenant>(await onGetTenantRequestEndpoint(deps, requestContext(requestOf('GET', externalApiPaths.getTenant + `?slug=${tenant.value}`), params)))
        const personalTrainingService: Service = mandatory(theTenant.services.find(s => s.id === multiLocationGym.pt1Hr), `Service ${multiLocationGym.pt1Hr} not found in ${JSON.stringify(theTenant.services)}`)
        expect(personalTrainingService.resourceRequirements).toHaveLength(1)
        const personalTrainerRequirement = personalTrainingService.resourceRequirements[0]
        const listOfPersonalTrainers = expectJson<ResourceSummary[]>(await listResourcesByTypeRequestEndpoint(deps, requestContext(requestOf('GET', externalApiPaths.listResourcesByType), {
            ...params,
            type: personalTrainer.value
        })))
        const ptMike = mandatory(listOfPersonalTrainers.find(pt => pt.name === 'ptMike'), `ptMike not found in ${JSON.stringify(listOfPersonalTrainers)}`)
        const requirementOverrides = [{
            requirementId: personalTrainerRequirement.id.value,
            resourceId: ptMike.id
        }]
        // Mike is not in Harlow on Saturday
        const onSaturday = `?fromDate=${saturday.value}&toDate=${saturday.value}`
        const mikesAvailabilityOnSaturday = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onSaturday, {requirementOverrides}), params)))
        expect(mikesAvailabilityOnSaturday.slots[saturday.value]).toBeUndefined()

        const onFriday = `?fromDate=${friday.value}&toDate=${friday.value}`
        const mikeOnFriday = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onFriday, JSON.stringify(requirementOverrides)), params)))
        expect(mikeOnFriday.slots[friday.value]).toHaveLength(17)
        const firstSlot = mikeOnFriday.slots[friday.value][0]
        const basket = unpricedBasket([unpricedBasketLine(personalTrainingService.id, harlow, [], friday, firstSlot, [])])
    });
})