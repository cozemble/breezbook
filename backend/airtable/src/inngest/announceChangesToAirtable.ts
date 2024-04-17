import {inngest} from './client.js';
import {prismaClient} from '../prisma/client.js';
import {Mutation} from '../mutation/mutations.js';
import {PrismaSynchronisationIdRepository, SynchronisationIdRepository} from './dataSynchronisation.js';
import {AirtableClient, HttpAirtableClient} from '../airtable/airtableClient.js';
import {carWashMapping} from '../airtable/learningMapping.js';
import {applyAirtablePlan} from '../airtable/applyAirtablePlan.js';
import {AirtableAccessTokenProvider} from './airtableAccessTokenProvider.js';
import {PrismaClient} from "@prisma/client";
import {DbMutationEvent, TenantEnvironmentPair} from "../prisma/dbtypes.js";

const announceChangesToAirtable = {
    fanOutChangesInTenantEnvironments: 'announceChanges/airtable/fanOutChangesInTenantEnvironments',
    onPendingChangeInTenantEnvironment: 'announceChanges/airtable/onPendingChangeInTenantEnvironment',
    // handleChangeBatchForOneEnvironment: 'announceChanges/airtable/handle-change-batch-for-one-environment',
    // handleOneChange: 'announceChanges/airtable/handle-one-change'
};


async function getTenantEnvironmentsPendingReplication(prisma: PrismaClient): Promise<TenantEnvironmentPair[]> {
    return await prisma.$queryRawUnsafe<TenantEnvironmentPair[]>(`
        SELECT DISTINCT m.tenant_id, m.environment_id
        FROM mutation_events m
                 LEFT JOIN replicated_mutation_events r
                           ON m.id = r.mutation_event_id AND r.to_system = 'airtable'
        WHERE r.mutation_event_id IS NULL
    `);
}

async function getEarliestNonReplicatedMutationEvent(prisma: PrismaClient, tenantId: string, environmentId: string): Promise<DbMutationEvent | null> {
    const result = await prisma.$queryRawUnsafe<DbMutationEvent[]>(`
        SELECT m.*
        FROM mutation_events m
                 LEFT JOIN replicated_mutation_events r on m.id = r.mutation_event_id AND r.to_system = 'airtable'
        WHERE r.mutation_event_id IS NULL
          AND m.tenant_id = '${tenantId}'
          AND m.environment_id = '${environmentId}'
        ORDER BY m.event_time ASC
        LIMIT 1
    `);

    // If there is a result, return it. Otherwise, return null.
    return result.length > 0 ? result[0] : null;
}

export const fanOutChangesInAllEnvironments = inngest.createFunction(
    {id: announceChangesToAirtable.fanOutChangesInTenantEnvironments},
    {cron: '*/5 * * * *'},
    async ({step}) => {
        await step.run('announceTenantEnvironmentsWithPendingReplication', async () => {
            const prisma = prismaClient();
            const tenantEnvironmentsWithChanges = await getTenantEnvironmentsPendingReplication(prisma);
            for (const tenantEnvironment of tenantEnvironmentsWithChanges) {
                await inngest.send({
                    name: announceChangesToAirtable.onPendingChangeInTenantEnvironment,
                    data: {tenantId: tenantEnvironment.tenant_id, environmentId: tenantEnvironment.environment_id}
                });

            }
        });
    }
);

export interface InngestInvocation {
    name: string;
    data: any;
}

export interface InngestStep {
    run<T>(name: string, f: () => Promise<T>): Promise<T>
    send(payload: InngestInvocation): Promise<void>
}

class DelegatingInngestStep implements InngestStep {
    constructor(private readonly inngest: any, private readonly step: any) {
    }

    async run<T>(name: string, f: () => Promise<T>): Promise<T> {
        return await this.step.run(name, f);
    }

    async send(payload: InngestInvocation): Promise<void> {
        await this.inngest.send(payload);
    }
}

export async function handlePendingChangeInTenantEnvironment(prisma: PrismaClient,
                                                             nextPendingReplicationFinder: (prisma: PrismaClient, tenantId: string, environmentId: string) => Promise<DbMutationEvent | null>,
                                                             synchronisationIdRepository: SynchronisationIdRepository,
                                                             airtableClient: AirtableClient,
                                                             tenantId: string,
                                                             environmentId: string,
                                                             inngestStep: InngestStep) {
    const maybePendingEvent = await inngestStep.run('findNextEvent', async () => {
        return nextPendingReplicationFinder(prisma, tenantId, environmentId);
    });
    if (maybePendingEvent) {
        await inngestStep.run('replicateEvent', async () => {
            await applyAirtablePlan(
                synchronisationIdRepository,
                airtableClient,
                carWashMapping,
                maybePendingEvent.event_data as any as Mutation
            );
        });
        await inngestStep.run('markEventAsReplicated', async () => {
            await prisma.replicated_mutation_events.create({
                data: {
                    mutation_event_id: maybePendingEvent.id,
                    to_system: 'airtable'
                }
            });
        });
        await inngestStep.run('queueAnotherPendingChange', async () => {
            await inngestStep.send({
                name: announceChangesToAirtable.onPendingChangeInTenantEnvironment,
                data: {tenantId, environmentId}
            });
        });
    }

}

export const onPendingChangeInTenantEnvironment = inngest.createFunction(
    {
        id: announceChangesToAirtable.onPendingChangeInTenantEnvironment,
        concurrency: {
            key: `event.data.tenantId + "-" + event.data.environmentId`,
            limit: 1
        }
    },
    {event: announceChangesToAirtable.onPendingChangeInTenantEnvironment},
    async ({event, step}) => {
        const {environmentId, tenantId} = event.data;
        const prisma = prismaClient();
        const prismaSynchronisationIdRepository = new PrismaSynchronisationIdRepository(prisma, tenantId, environmentId);
        const httpAirtableClient = new HttpAirtableClient('https://api.airtable.com/v0', new AirtableAccessTokenProvider(tenantId, environmentId));
        const inngestStep = new DelegatingInngestStep(inngest, step);
        await handlePendingChangeInTenantEnvironment(prisma, getEarliestNonReplicatedMutationEvent, prismaSynchronisationIdRepository, httpAirtableClient, tenantId, environmentId, inngestStep);
    }
);
