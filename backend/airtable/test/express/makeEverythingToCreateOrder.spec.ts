import {expect, test} from 'vitest'
import {
    EverythingToCreateOrderReferenceData,
    makeEverythingToCreateOrder
} from "../../src/express/onAddOrderExpress.js";
import {AnySuitableResource, carwash, fullPaymentOnCheckout, SpecificResource} from "@breezbook/packages-core";
import {
    pricedBasket,
    pricedBasketLine,
    pricedCreateOrderRequest,
    ResourceRequirementOverride,
    resourceRequirementOverride
} from "@breezbook/backend-api-types";
import {fourDaysFromNow, goodCustomer} from "../helper.js";

function createOrder(overrides: ResourceRequirementOverride[]) {
    return pricedCreateOrderRequest(pricedBasket([
            pricedBasketLine(
                carwash.locations.london,
                carwash.smallCarWash.id,
                [],
                carwash.smallCarWash.price,
                carwash.smallCarWash.price,
                fourDaysFromNow,
                carwash.nineAm, [], overrides)], carwash.smallCarWash.price),
        goodCustomer, fullPaymentOnCheckout());
}

const referenceData: EverythingToCreateOrderReferenceData = {
    services: carwash.services,
    resources: carwash.resources,
    addOns: carwash.addOns,
    coupons: carwash.coupons,
}


test("services retain their existing resource requirements when no overrides are provided", () => {
    const order = createOrder([]);
    const outcome = makeEverythingToCreateOrder(referenceData, order)
    const allServiceResourceRequirements = outcome.basket.lines.flatMap(line => line.service.resourceRequirements)
    if (allServiceResourceRequirements.length !== 1) {
        throw new Error(`Expected 1 resource requirement but got ${allServiceResourceRequirements.length}`)
    }
    const finalResourceRequirement = allServiceResourceRequirements[0] as AnySuitableResource
    expect(finalResourceRequirement.requirement).toBe(carwash.van)
})

test("replaces resource requirements in contained services", () => {
    const override = resourceRequirementOverride(carwash.smallCarWash.resourceRequirements[0].id, carwash.resources[0].id)
    const order = createOrder([override]);
    const outcome = makeEverythingToCreateOrder(referenceData, order)
    const allServiceResourceRequirements = outcome.basket.lines.flatMap(line => line.service.resourceRequirements)
    if (allServiceResourceRequirements.length !== 1) {
        throw new Error(`Expected 1 resource requirement but got ${allServiceResourceRequirements.length}`)
    }
    const finalResourceRequirement = allServiceResourceRequirements[0] as SpecificResource
    expect(finalResourceRequirement.resource).toBe(carwash.resources[0])
})