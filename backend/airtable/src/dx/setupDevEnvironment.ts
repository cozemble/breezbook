import {prismaClient} from "../prisma/client.js";
import {loadTestCarWashTenant} from "./loadTestCarWashTenant.js";
import {maybePublishRefDataToAssistLocalDev} from "./maybePublishRefDataToAssistLocalDev.js";

export async function setupDevEnvironment(expressPort: number) {
    const prisma = prismaClient();
    if(await prisma.tenants.findFirst({where: {tenant_id: 'tenant1'}})) {
        console.log("Test tenant already exists, skipping setupDevEnvironment")
        return;
    }
    await loadTestCarWashTenant(prismaClient());
    await maybePublishRefDataToAssistLocalDev(expressPort);
}