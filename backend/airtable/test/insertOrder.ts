import {TenantEnvironment, TenantSettings} from "@breezbook/packages-core";
import {OrderCreatedResponse, PricedCreateOrderRequest} from "@breezbook/backend-api-types";
import {doInsertOrder} from "../src/express/doInsertOrder.js";
import {prismaClient} from "../src/prisma/client.js";
import {prismaMutationToPromise} from "../src/infra/prismaMutations.js";
import {EverythingToCreateOrderReferenceData, makeEverythingToCreateOrder} from "../src/express/onAddOrderExpress.js";

export async function insertOrder(
    tenantEnvironment: TenantEnvironment,
    pricedCreateOrderRequest: PricedCreateOrderRequest,
    referenceData: EverythingToCreateOrderReferenceData,
    tenantSettings: TenantSettings
): Promise<OrderCreatedResponse> {
    const order = makeEverythingToCreateOrder(referenceData, pricedCreateOrderRequest)
    const {
        mutations,
        orderCreatedResponse
    } = doInsertOrder(tenantEnvironment, order, referenceData.services, tenantSettings);
    const prisma = prismaClient();
    await prisma.$transaction(mutations.mutations.map((mutation) => prismaMutationToPromise(prisma, mutation)));
    return orderCreatedResponse;
}