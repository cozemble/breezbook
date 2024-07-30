import {expect, test} from 'vitest'
import {
    EverythingToCreateOrderReferenceData,
    makeEverythingToCreateOrder
} from "../../src/express/onAddOrderExpress.js";
import {carwash, fullPaymentOnCheckout} from "@breezbook/packages-core";
import * as api from "@breezbook/backend-api-types";
import {fourDaysFromNow, goodCustomer} from "../helper.js";
import {resourcing} from "@breezbook/packages-resourcing";
import {capacity, duration, minutes} from "@breezbook/packages-types";
import AnySuitableResource = resourcing.AnySuitableResource;
import SpecificResource = resourcing.SpecificResource;

function createOrder(overrides: api.ResourceRequirementOverride[]) {
    return api.pricedCreateOrderRequest(api.pricedBasket([
            api.pricedBasketLine(
                carwash.locations.london,
                carwash.smallCarWash.id,
                capacity(1),
                api.priceBreakdown(carwash.smallCarWash.price.amount.value, carwash.smallCarWash.price.currency.value, carwash.smallCarWash.price.amount.value, [], []),
                fourDaysFromNow,
                carwash.nineAm, duration(minutes(120)), [], overrides)], carwash.smallCarWash.price),
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
    expect(finalResourceRequirement.resourceType).toBe(carwash.van)
})

test("replaces resource requirements in contained services", () => {
    const override = api.resourceRequirementOverride(carwash.smallCarWash.resourceRequirements[0].id.value, carwash.resources[0].id.value)
    const order = createOrder([override]);
    const outcome = makeEverythingToCreateOrder(referenceData, order)
    const allServiceResourceRequirements = outcome.basket.lines.flatMap(line => line.service.resourceRequirements)
    if (allServiceResourceRequirements.length !== 1) {
        throw new Error(`Expected 1 resource requirement but got ${allServiceResourceRequirements.length}`)
    }
    const finalResourceRequirement = allServiceResourceRequirements[0] as SpecificResource
    expect(finalResourceRequirement.resource).toBe(carwash.resources[0])
})