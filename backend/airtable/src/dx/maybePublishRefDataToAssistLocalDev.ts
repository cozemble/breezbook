import {prismaClient} from "../prisma/client.js";
import {mandatory} from "@breezbook/packages-core";
import {internalApiPaths} from "../express/expressApp.js";

export async function maybePublishRefDataToAssistLocalDev(): Promise<void> {
    await maybePublishRefData('tenant1', 'dev');
    await maybePublishRefData('thesmartwashltd', 'dev');
    await maybePublishRefData('thesmartwashltd', 'prod');
}

async function maybePublishRefData(tenantId:string, environmentId:string): Promise<void> {
    const prisma = prismaClient();
    const maybeServiceMutation = await prisma.mutation_events.findFirst({
        where: {
            entity_type: "services",
            tenant_id: tenantId,
            environment_id: environmentId
        }
    })
    if (maybeServiceMutation) {
        console.log(`Reference data already published for tenant ${tenantId} and environment ${environmentId}`)
        return;
    }
    const apiKey = mandatory(process.env.INTERNAL_API_KEY, "No INTERNAL_API_KEY set");
    const rootUrl = mandatory(process.env.BREEZBOOK_URL_ROOT, "No BREEZBOOK_URL_ROOT set");
    const url = `${rootUrl}${internalApiPaths.publishReferenceDataAsMutationEvents}`
        .replace(':envId', environmentId)
        .replace(':tenantId', tenantId);
    await fetch(url, {
        method: 'POST',
        headers: {
            "Authorization": apiKey
        }
    }).catch(e => console.error(e));
    console.log(`Published reference data as mutation events to aid local dx, by calling ${url}`)
}