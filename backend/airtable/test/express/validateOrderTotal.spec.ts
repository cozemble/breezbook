import {beforeEach, describe, expect, test} from "vitest";
import {validateOrderTotal} from "../../src/express/addOrderValidations.js";
import {everythingToCreateOrder, hydratedBasket, hydratedBasketLine} from "../../src/express/onAddOrderExpress.js";
import {goodCustomer} from "../helper.js";
import {currencies, fullPaymentOnCheckout, price, Service, serviceFns} from "@breezbook/packages-core";
import {PrismockClient} from "prismock";
import {loadMultiLocationGymTenant, multiLocationGym} from "../../src/dx/loadMultiLocationGymTenant.js";
import {byLocation} from "../../src/availability/byLocation.js";
import {
    capacity,
    duration,
    environmentId,
    isoDate, isoDateFns,
    locationId,
    mandatory,
    minutes,
    serviceId,
    tenantEnvironmentLocation,
    tenantId,
    time24
} from "@breezbook/packages-types";
import {EverythingForAvailability} from "../../src/express/getEverythingForAvailability.js";
import {resourcing} from "@breezbook/packages-resourcing";
import Resource = resourcing.Resource;

const tenantEnvLoc = tenantEnvironmentLocation(environmentId(multiLocationGym.environment_id), tenantId(multiLocationGym.tenant_id), locationId(multiLocationGym.locationLondon))

describe("given resource dependent pricing", () => {
    let everything: EverythingForAvailability
    let personalTrainingService: Service
    let personalTrainerRequirement: resourcing.ResourceRequirement
    let ptMike: Resource
    let ptMete: Resource

    const date = isoDate('2024-08-06')
    const priceForMike = price(7000, currencies.GBP)
    const priceForMete = price(9000, currencies.GBP) // Mete is £20 an hour more expensive

    beforeEach(async () => {
        const prisma = new PrismockClient()
        await loadMultiLocationGymTenant(prisma)
        everything = await byLocation.getEverythingForAvailability(prisma, tenantEnvLoc, date, date);
        personalTrainingService = serviceFns.findService(everything.businessConfiguration.services, serviceId(multiLocationGym.pt1Hr))
        personalTrainerRequirement = mandatory(personalTrainingService.resourceRequirements.find(r => r._type === "any.suitable.resource" && r.resourceType.value === "personal.trainer"), `personal trainer requirement not found`)
        ptMike = mandatory(everything.businessConfiguration.resources.find(r => r.id.value.toLowerCase().includes("mike")), `mike not found`)
        ptMete = mandatory(everything.businessConfiguration.resources.find(r => r.id.value.toLowerCase().includes("mete")), `mete not found`)
    })

    test("no error when price is correct", async () => {
        const basketForMete = hydratedBasket([
            hydratedBasketLine(
                personalTrainingService,
                tenantEnvLoc.locationId,
                capacity(1),
                [],
                [],
                priceForMete,
                priceForMete,
                date,
                time24('09:00'),
                duration(minutes(60)),
                [],
                [{
                    requirementId: personalTrainerRequirement.id.value,
                    resourceId: ptMete.id.value
                }])])
        const outcomeForMete = validateOrderTotal(everything, everythingToCreateOrder(basketForMete, goodCustomer, fullPaymentOnCheckout()));
        expect(outcomeForMete).toBe(null);

        const basketForMike = hydratedBasket([
            hydratedBasketLine(
                personalTrainingService,
                tenantEnvLoc.locationId,
                capacity(1),
                [],
                [],
                priceForMike,
                priceForMike,
                date,
                time24('09:00'),
                duration(minutes(60)),
                [],
                [{
                    requirementId: personalTrainerRequirement.id.value,
                    resourceId: ptMike.id.value
                }])])
        const outcomeForMike = validateOrderTotal(everything, everythingToCreateOrder(basketForMike, goodCustomer, fullPaymentOnCheckout()));
        expect(outcomeForMike).toBe(null);
    })
})