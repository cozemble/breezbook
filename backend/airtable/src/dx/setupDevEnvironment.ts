import {prismaClient} from "../prisma/client.js";
import {ensureStripeKeys, loadTestCarWashTenant} from "./loadTestCarWashTenant.js";
import {maybePublishRefDataToAssistLocalDev} from "./maybePublishRefDataToAssistLocalDev.js";
import {environmentId, tenantEnvironment, tenantId} from "@breezbook/packages-core";
import {loadMultiLocationGymTenant} from "./loadMultiLocationGymTenant.js";

export async function setupDevEnvironment() {
    const prisma = prismaClient();
    if(await prisma.tenants.findFirst({where: {tenant_id: 'tenant1'}})) {
        console.log("Test tenant already exists, skipping setupDevEnvironment")
    } else {
        await loadTestCarWashTenant(prisma);
    }
    await loadMultiLocationGymTenant(prisma)
    await maybePublishRefDataToAssistLocalDev();
    await ensureStripeKeys(prisma, tenantEnvironment(environmentId('dev'), tenantId('tenant1')));
}