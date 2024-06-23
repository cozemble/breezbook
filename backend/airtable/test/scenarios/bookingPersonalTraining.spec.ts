import {beforeEach, describe, expect, test} from "vitest";
import {PrismockClient} from "prismock";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";
import {EndpointDependencies, EndpointOutcome, specifiedDeps} from "../../src/infra/endpoint.js";
import {
    customer,
    environmentId,
    fullPaymentOnCheckout,
    isoDateFns,
    locationId,
    mandatory,
    resourceType,
    serviceId,
    tenantEnvironment,
    tenantId,
    time24
} from "@breezbook/packages-core";
import {ResourceSummary} from "../../src/core/resources/resources.js";
import {expectJson} from "../helper.js";
import {
    AvailabilityResponse,
    OrderCreatedResponse,
    PricedBasket,
    pricedCreateOrderRequest,
    ResourceRequirement,
    resourceRequirementOverride,
    Service,
    Tenant,
    unpricedBasket,
    unpricedBasketLine
} from "@breezbook/backend-api-types";
import {
    getServiceAvailabilityForLocationEndpoint
} from "../../src/express/availability/getServiceAvailabilityForLocation.js";
import {externalApiPaths} from "../../src/express/expressApp.js";
import {requestContext} from "../../src/infra/http/expressHttp4t.js";
import {onGetTenantRequestEndpoint} from "../../src/express/tenants/tenantHandlers.js";
import {listResourcesByTypeRequestEndpoint} from "../../src/express/resources/resourcesHandler.js";
import {basketPriceRequestEndpoint} from "../../src/express/basket/basketHandler.js";
import {addOrderEndpoint} from "../../src/express/onAddOrderExpress.js";
import {applyMutations} from "../../src/prisma/applyMutations.js";
import {requestOf} from "@breezbook/packages-http/dist/requests.js";

const env = environmentId(multiLocationGym.environment_id);
const tenant = tenantId(multiLocationGym.tenant_id);
const harlow = locationId(multiLocationGym.locationHarlow)
const personalTrainer = resourceType('personal.trainer')
const personalTraining = serviceId(multiLocationGym.pt1Hr)
const friday = isoDateFns.next('Friday')
const saturday = isoDateFns.next('Saturday')

const params = {
    'envId': env.value,
    'tenantId': tenant.value,
    'serviceId': personalTraining.value,
    locationId: harlow.value
}

async function getReferenceData(deps: EndpointDependencies): Promise<{
    personalTrainingService: Service,
    personalTrainerRequirement: ResourceRequirement,
    ptMike: ResourceSummary
}> {
    const theTenant = expectJson<Tenant>(await onGetTenantRequestEndpoint(deps, requestContext(requestOf('GET', externalApiPaths.getTenant + `?slug=${tenant.value}`), params)))
    const personalTrainingService: Service = mandatory(theTenant.services.find(s => s.id === multiLocationGym.pt1Hr), `Service ${multiLocationGym.pt1Hr} not found in ${JSON.stringify(theTenant.services)}`)
    expect(personalTrainingService.resourceRequirements).toHaveLength(1)
    const personalTrainerRequirement = mandatory(personalTrainingService.resourceRequirements[0], `No resource requirements`);
    const listOfPersonalTrainers = expectJson<ResourceSummary[]>(await listResourcesByTypeRequestEndpoint(deps, requestContext(requestOf('GET', externalApiPaths.listResourcesByType), {
        ...params,
        type: personalTrainer.value
    })))
    const ptMike: ResourceSummary = mandatory(listOfPersonalTrainers.find(pt => pt.name === 'Mike'), `PT Mike not found in ${JSON.stringify(listOfPersonalTrainers)}`)
    return {personalTrainingService, personalTrainerRequirement, ptMike};
}

async function bookLastSlotOnFriday(deps: EndpointDependencies, requirementOverrides: {
    resourceId: string;
    requirementId: string
}[], personalTrainingService: Service, personalTrainerRequirement: ResourceRequirement, ptMike: ResourceSummary): Promise<OrderCreatedResponse> {
    const onFriday = `?fromDate=${friday.value}&toDate=${friday.value}`
    const mikeOnFriday = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onFriday, {requirementOverrides}), params)))
    const fridaySlots = mikeOnFriday.slots?.[friday.value] ?? []
    const lastSlot = mandatory(fridaySlots[fridaySlots.length - 1], `No final slot for Mike on Friday`)
    const basket = unpricedBasket([unpricedBasketLine(personalTrainingService.id, harlow, [], friday, time24(lastSlot.startTime24hr), [{goals: "get fit"}], [resourceRequirementOverride(personalTrainerRequirement.id.value, ptMike.id)])])
    const pricedBasket = expectJson<PricedBasket>(await basketPriceRequestEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.priceBasket, basket), params)))
    const orderRequest = pricedCreateOrderRequest(pricedBasket, customer("Mike", "Hogan", "mike@email.com", "+14155552671"), fullPaymentOnCheckout())
    const orderResponse = expectJson<OrderCreatedResponse>(await addOrderEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.addOrder, orderRequest), params)).then(outcomes => handleMutations(deps, outcomes)))
    expect(orderResponse.bookingIds).toHaveLength(1)
    return orderResponse
}

describe("given the test gym tenant", () => {
    let deps: EndpointDependencies;

    beforeEach(async () => {
        const prisma = new PrismockClient()
        await loadMultiLocationGymTenant(prisma)
        deps = specifiedDeps(prisma, () => Promise.resolve())
    })

    test("endpoints support an end to end booking flow", async () => {
        const {personalTrainingService, personalTrainerRequirement, ptMike} = await getReferenceData(deps);
        const requirementOverrides = [{
            requirementId: personalTrainerRequirement.id.value,
            resourceId: ptMike.id
        }]
        // Mike is not in Harlow on Saturday
        const onSaturday = `?fromDate=${saturday.value}&toDate=${saturday.value}`
        const mikesAvailabilityOnSaturday = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onSaturday, {requirementOverrides}), params)))
        expect(mikesAvailabilityOnSaturday.slots[saturday.value]).toBeUndefined()

        const onFriday = `?fromDate=${friday.value}&toDate=${friday.value}`
        const mikeOnFriday = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onFriday, {requirementOverrides}), params)))
        expect(mikeOnFriday.slots?.[friday.value]).toHaveLength(17)
        const firstSlot = mandatory(mikeOnFriday?.slots?.[friday.value]?.[0], `No slots found for Mike on Friday`)
        const basket = unpricedBasket([unpricedBasketLine(personalTrainingService.id, harlow, [], friday, time24(firstSlot.startTime24hr), [{goals: "get fit"}], [resourceRequirementOverride(personalTrainerRequirement.id.value, ptMike.id)])])
        const pricedBasket = expectJson<PricedBasket>(await basketPriceRequestEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.priceBasket, basket), params)))
        const orderRequest = pricedCreateOrderRequest(pricedBasket, customer("Mike", "Hogan", "mike@email.com", "+14155552671"), fullPaymentOnCheckout())
        const orderResponse = expectJson<OrderCreatedResponse>(await addOrderEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.addOrder, orderRequest), params)).then(outcomes => handleMutations(deps, outcomes)))
        expect(orderResponse.bookingIds).toHaveLength(1)
        const bookingId = mandatory(orderResponse.bookingIds[0], `No booking id found in ${JSON.stringify(orderResponse)}`)
        const booking = await deps.prisma.bookings.findUnique({
            where: {id: bookingId},
            include: {booking_resource_requirements: true}
        })
        if (!booking) {
            throw new Error(`Booking ${bookingId} not found`)
        }
        const resourceRequirements = mandatory(booking.booking_resource_requirements, `No resource requirements found for booking ${bookingId}`)
        expect(resourceRequirements).toHaveLength(1)
        const requirement = mandatory(resourceRequirements[0], `No resource requirement found for booking ${bookingId}`)
        expect(requirement.requirement_type).toBe("specific_resource")
        expect(requirement.resource_id).toBe(ptMike.id)

        // resource should now be consumed
        const mikeOnFridayAgain = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onFriday, {requirementOverrides}), params)))
        expect(mikeOnFridayAgain.slots[friday.value]).toHaveLength(15)
    });

    test("can book the same personal trainer back to back", async () => {
        const {personalTrainingService, personalTrainerRequirement, ptMike} = await getReferenceData(deps);
        const requirementOverrides = [{
            requirementId: personalTrainerRequirement.id.value,
            resourceId: ptMike.id
        }]
        const order1 = await bookLastSlotOnFriday(deps, requirementOverrides, personalTrainingService, personalTrainerRequirement, ptMike);
        const order2 = await bookLastSlotOnFriday(deps, requirementOverrides, personalTrainingService, personalTrainerRequirement, ptMike);
        const order3 = await bookLastSlotOnFriday(deps, requirementOverrides, personalTrainingService, personalTrainerRequirement, ptMike);
    });
})

async function handleMutations(deps: EndpointDependencies, outcomes: EndpointOutcome[]): EndpointOutcome[] {
    for (const outcome of outcomes) {
        if (outcome._type === 'mutation.outcome') {
            await applyMutations(deps.prisma, tenantEnvironment(env, tenant), outcome.mutations.mutations)
        }
    }
    return outcomes
}
