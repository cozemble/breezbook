import {beforeEach, describe, expect, test} from "vitest";
import {PrismockClient} from "prismock";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";
import {EndpointDependencies, EndpointOutcome, specifiedDeps} from "../../src/infra/endpoint.js";
import {customer, fullPaymentOnCheckout,} from "@breezbook/packages-core";
import {expectJson} from "../helper.js";
import {
    api,
    AvailabilityResponse,
    OrderCreatedResponse,
    PricedBasket,
    pricedCreateOrderRequest,
    resourceRequirementOverride,
    ResourceRequirementSpec,
    ResourceSummary,
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
import {
    environmentId,
    locationId,
    mandatory,
    resourceType,
    serviceId,
    tenantEnvironment,
    tenantId,
} from "@breezbook/packages-types";
import serviceAvailabilityOptions = api.serviceAvailabilityOptions;
import ServiceAvailabilityOptions = api.ServiceAvailabilityOptions;
import { duration, IsoDate, isoDateFns, minutes, time24, timezones } from '@breezbook/packages-date-time';

const env = environmentId(multiLocationGym.environment_id);
const tenant = tenantId(multiLocationGym.tenant_id);
const london = locationId(multiLocationGym.locationLondon)
const personalTrainer = resourceType('personal.trainer')
const personalTraining = serviceId(multiLocationGym.pt1Hr)
const friday = isoDateFns.next(timezones.utc,'Friday')
const saturday = isoDateFns.next(timezones.utc,'Saturday')
const tuesday = isoDateFns.next(timezones.utc,'Tuesday')

const params = {
    'envId': env.value,
    'tenantId': tenant.value,
    'serviceId': personalTraining.value,
    locationId: london.value
}

async function getReferenceData(deps: EndpointDependencies): Promise<{
    personalTrainingService: Service,
    personalTrainerRequirement: ResourceRequirementSpec,
    ptMike: ResourceSummary,
    ptMete: ResourceSummary,
}> {
    const theTenant = expectJson<Tenant>(await onGetTenantRequestEndpoint(deps, requestContext(requestOf('GET', externalApiPaths.getTenant + `?slug=${tenant.value}`), params)))
    const personalTrainingService = mandatory(theTenant.services.find(s => s.id === multiLocationGym.pt1Hr), `Service ${multiLocationGym.pt1Hr} not found in ${JSON.stringify(theTenant.services)}`)
    expect(personalTrainingService.resourceRequirements).toHaveLength(1)
    const personalTrainerRequirement = mandatory(personalTrainingService.resourceRequirements[0], `No resource requirements`);
    const listOfPersonalTrainers = expectJson<ResourceSummary[]>(await listResourcesByTypeRequestEndpoint(deps, requestContext(requestOf('GET', externalApiPaths.listResourcesByType), {
        ...params,
        type: personalTrainer.value
    })))
    const ptMike: ResourceSummary = mandatory(listOfPersonalTrainers.find(pt => pt.name === 'Mike'), `PT Mike not found in ${JSON.stringify(listOfPersonalTrainers)}`)
    const ptMete: ResourceSummary = mandatory(listOfPersonalTrainers.find(pt => pt.name === 'Mete'), `PT Mete not found in ${JSON.stringify(listOfPersonalTrainers)}`)
    return {personalTrainingService, personalTrainerRequirement, ptMike, ptMete};
}

async function bookLastSlotOnDay(deps: EndpointDependencies, availabilityOptions: ServiceAvailabilityOptions, personalTrainingService: Service, personalTrainerRequirement: ResourceRequirementSpec, preferredPt: ResourceSummary, day: IsoDate): Promise<OrderCreatedResponse> {
    const onDay = `?fromDate=${day.value}&toDate=${day.value}`
    const availabilityResponse = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onDay, availabilityOptions as any), params)))
    const availableSlots = availabilityResponse.slots?.[friday.value] ?? []
    const lastSlot = mandatory(availableSlots[availableSlots.length - 1], `No final slot for Mike on Friday`)
    const basket = unpricedBasket([unpricedBasketLine(personalTrainingService.id, london, [], friday, time24(lastSlot.startTime24hr), duration(minutes(60)), [{goals: "get fit"}], [resourceRequirementOverride(personalTrainerRequirement.id.value, preferredPt.id)])])
    const pricedBasket = expectJson<PricedBasket>(await basketPriceRequestEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.priceBasket, basket as any), params)))
    const orderRequest = pricedCreateOrderRequest(pricedBasket, customer("Mike", "Hogan", "mike@email.com", "+14155552671"), fullPaymentOnCheckout())
    const orderResponse = expectJson<OrderCreatedResponse>(await addOrderEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.addOrder, orderRequest as any), params)).then(outcomes => handleMutations(deps, outcomes)))
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
        const availabilityOptions = serviceAvailabilityOptions([], [{
                requirementId: personalTrainerRequirement.id.value,
                resourceId: ptMike.id
            }]
            , [])
        // Mike is not in London on Saturday
        const onSaturday = `?fromDate=${saturday.value}&toDate=${saturday.value}`
        const mikesAvailabilityOnSaturday = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onSaturday, availabilityOptions as any), params)))
        expect(mikesAvailabilityOnSaturday.slots[saturday.value]).toBeUndefined()

        const onFriday = `?fromDate=${friday.value}&toDate=${friday.value}`
        const mikeOnFriday = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onFriday, availabilityOptions as any), params)))
        expect(mikeOnFriday.slots?.[friday.value]).toHaveLength(17)
        const firstSlot = mandatory(mikeOnFriday?.slots?.[friday.value]?.[0], `No slots found for Mike on Friday`)
        expect(firstSlot.priceWithNoDecimalPlaces).toBe(7000)
        const basket = unpricedBasket([unpricedBasketLine(personalTrainingService.id, london, [], friday, time24(firstSlot.startTime24hr), duration(minutes(60)),[{goals: "get fit"}], [resourceRequirementOverride(personalTrainerRequirement.id.value, ptMike.id)])])
        const pricedBasket = expectJson<PricedBasket>(await basketPriceRequestEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.priceBasket, basket as any), params)))
        const orderRequest = pricedCreateOrderRequest(pricedBasket, customer("Mike", "Hogan", "mike@email.com", "+14155552671"), fullPaymentOnCheckout())
        const orderResponse = expectJson<OrderCreatedResponse>(await addOrderEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.addOrder, orderRequest as any), params)).then(outcomes => handleMutations(deps, outcomes)))
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
        const mikeOnFridayAgain = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onFriday, availabilityOptions as any), params)))
        expect(mikeOnFridayAgain.slots[friday.value]).toHaveLength(15)
    });

    test("can book the same personal trainer back to back", async () => {
        const {personalTrainingService, personalTrainerRequirement, ptMike} = await getReferenceData(deps);
        const availabilityOptions = serviceAvailabilityOptions([], [{
                requirementId: personalTrainerRequirement.id.value,
                resourceId: ptMike.id
            }]
            , [])

        await bookLastSlotOnDay(deps, availabilityOptions, personalTrainingService, personalTrainerRequirement, ptMike, friday);
        await bookLastSlotOnDay(deps, availabilityOptions, personalTrainingService, personalTrainerRequirement, ptMike, friday);
        await bookLastSlotOnDay(deps, availabilityOptions, personalTrainingService, personalTrainerRequirement, ptMike, friday);
    });

    test("Mete is more expensive than Mike because Mete is tagged as elite", async () => {
        const {personalTrainerRequirement, ptMete} = await getReferenceData(deps);
        const availabilityOptions = serviceAvailabilityOptions([], [{
                requirementId: personalTrainerRequirement.id.value,
                resourceId: ptMete.id
            }]
            , [])
        const onTuesday = `?fromDate=${tuesday.value}&toDate=${tuesday.value}`
        const availabilityResponse = expectJson<AvailabilityResponse>(await getServiceAvailabilityForLocationEndpoint(deps, requestContext(requestOf('POST', externalApiPaths.getAvailabilityForLocation + onTuesday, availabilityOptions as any), params)))
        expect(availabilityResponse.slots?.[tuesday.value]).toHaveLength(17)
        const availableSlots = availabilityResponse.slots?.[tuesday.value] ?? []
        const lastSlot = mandatory(availableSlots[availableSlots.length - 1], `No final slot available`)
        expect(lastSlot.priceWithNoDecimalPlaces).toBe(9000)
    })
})

async function handleMutations(deps: EndpointDependencies, outcomes: EndpointOutcome[]): Promise<EndpointOutcome[]> {
    for (const outcome of outcomes) {
        if (outcome._type === 'mutation.outcome') {
            await applyMutations(deps.prisma, tenantEnvironment(env, tenant), outcome.mutations.mutations)
        }
    }
    return outcomes
}
