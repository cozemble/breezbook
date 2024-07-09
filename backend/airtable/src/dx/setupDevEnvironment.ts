import {prismaClient} from "../prisma/client.js";
import {ensureStripeKeys, loadTestCarWashTenant} from "./loadTestCarWashTenant.js";
import {environmentId, tenantEnvironment, tenantId} from "@breezbook/packages-types";
import {loadMultiLocationGymTenant} from "./loadMultiLocationGymTenant.js";
import {loadDogWalkingTenant} from "./loadDogWalkingTenant.js";

export async function setupDevEnvironment() {
    const prisma = prismaClient();
    if (await prisma.tenants.findFirst({where: {tenant_id: 'tenant1'}})) {
        console.log("Test tenant already exists, skipping setupDevEnvironment")
    } else {
        await loadTestCarWashTenant(prisma);
    }
    await loadMultiLocationGymTenant(prisma)
    await loadDogWalkingTenant(prisma)
    await ensureStripeKeys(tenantEnvironment(environmentId('dev'), tenantId('tenant1')));
    await ensureStripeKeys(tenantEnvironment(environmentId('dev'), tenantId('thesmartwashltd')));
    await ensureStripeKeys(tenantEnvironment(environmentId('dev'), tenantId('breezbook-gym')));
}