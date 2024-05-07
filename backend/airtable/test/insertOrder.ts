import {Service, TenantEnvironment, TenantSettings} from "@breezbook/packages-core";
import {OrderCreatedResponse, PricedCreateOrderRequest} from "@breezbook/backend-api-types";
import {doInsertOrder} from "../src/express/doInsertOrder.js";
import {prismaClient} from "../src/prisma/client.js";
import {prismaMutationToPromise} from "../src/infra/prismaMutations.js";

export async function insertOrder(
    tenantEnvironment: TenantEnvironment,
    pricedCreateOrderRequest: PricedCreateOrderRequest,
    services: Service[],
    tenantSettings: TenantSettings
): Promise<OrderCreatedResponse> {
    const {
        mutations,
        orderCreatedResponse
    } = doInsertOrder(tenantEnvironment, pricedCreateOrderRequest, services, tenantSettings);
    const prisma = prismaClient();
    await prisma.$transaction(mutations.mutations.map((mutation) => prismaMutationToPromise(prisma, mutation)));
    return orderCreatedResponse;
}