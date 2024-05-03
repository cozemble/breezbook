import {inngest} from './client.js';
import {prismaClient} from '../prisma/client.js';
import {Mutation} from '../mutation/mutations.js';
import {PrismaSynchronisationIdRepository, SynchronisationIdRepository} from './dataSynchronisation.js';
import {AirtableClient, AirtableClientFailure, HttpAirtableClient} from '../airtable/airtableClient.js';
import {applyAirtablePlan, FailedAppliedAirtableMapping} from '../airtable/applyAirtablePlan.js';
import {AirtableAccessTokenProvider} from './airtableAccessTokenProvider.js';
import {PrismaClient} from "@prisma/client";
import {DbMutationEvent, TenantEnvironmentPair} from "../prisma/dbtypes.js";
import {airtableSystemName} from "../express/oauth/airtableConnect.js";
// import {carWashMapping} from "../airtable/carWashMapping.js";
import {acquireLock, releaseLock} from "./tenantEnvironmentLock.js";
import {AirtableMappingPlan, MappingPlanFinder} from "../airtable/airtableMappingTypes.js";
import {natsCarWashAirtableMapping} from "../airtable/natsCarWashAirtableMapping.js";
import {carWashMapping} from "../airtable/carWashMapping.js";

const announceChangesToAirtable = {
    fanOutChangesInTenantEnvironments: 'announceChanges/airtable/fanOutChangesInTenantEnvironments',
    onPendingChangeInTenantEnvironment: 'announceChanges/airtable/onPendingChangeInTenantEnvironment',
};


async function getTenantEnvironmentsPendingReplication(prisma: PrismaClient): Promise<TenantEnvironmentPair[]> {
    return await prisma.$queryRawUnsafe<TenantEnvironmentPair[]>(`
        SELECT DISTINCT m.tenant_id, m.environment_id
        FROM mutation_events m
                 LEFT JOIN replicated_mutation_events r
                           ON m.id = r.mutation_event_id AND r.to_system = '${airtableSystemName}'
        WHERE r.mutation_event_id IS NULL
    `);
}

async function getEarliestNonReplicatedMutationEvent(prisma: PrismaClient, tenantId: string, environmentId: string): Promise<DbMutationEvent | null> {
    const result = await prisma.$queryRawUnsafe<DbMutationEvent[]>(`
        SELECT m.*
        FROM mutation_events m
                 LEFT JOIN replicated_mutation_events r
                           on m.id = r.mutation_event_id AND r.to_system = '${airtableSystemName}'
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
            return tenantEnvironmentsWithChanges
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

interface Logger {
    info(...args: any[]): void;

    warn(...args: any[]): void;

    error(...args: any[]): void;

    debug(...args: any[]): void;
}

export class ConsoleLogger implements Logger {
    info(...args: any[]): void {
        console.log(...args);
    }

    warn(...args: any[]): void {
        console.warn(...args);
    }

    error(...args: any[]): void {
        console.error(...args);
    }

    debug(...args: any[]): void {
        console.debug(...args);
    }
}

export function consoleLogger(): Logger {
    return new ConsoleLogger();
}

export async function handlePendingChangeInTenantEnvironment(prisma: PrismaClient,
                                                             logger: Logger,
                                                             mappingFinder: MappingPlanFinder,
                                                             nextPendingReplicationFinder: (prisma: PrismaClient, tenantId: string, environmentId: string) => Promise<DbMutationEvent | null>,
                                                             synchronisationIdRepository: SynchronisationIdRepository,
                                                             airtableClient: AirtableClient,
                                                             tenantId: string,
                                                             environmentId: string,
                                                             inngestStep: InngestStep) {
    const mapping = await mappingFinder(tenantId, environmentId);
    if (!mapping) {
        logger.info(`No mapping found for tenant ${tenantId} environment ${environmentId}, skipping`);
        return;
    }
    const locked = await inngestStep.run('acquireLock', async () => {
        return await acquireLock(prisma, tenantId, environmentId)
    });
    if (!locked) {
        logger.info(`Tenant ${tenantId} environment ${environmentId} already locked, skipping`);
        return;
    }
    const maybePendingEvent = await inngestStep.run('findNextEvent', async () => {
        return nextPendingReplicationFinder(prisma, tenantId, environmentId);
    });
    if (maybePendingEvent) {
        logger.info(`Replicating event ${maybePendingEvent.id} (${maybePendingEvent.event_type}:${maybePendingEvent.entity_type}) for tenant ${tenantId} environment ${environmentId}`)
        await inngestStep.run('replicateEvent', async () => {
            const outcomes = await applyAirtablePlan(
                synchronisationIdRepository,
                airtableClient,
                mapping,
                maybePendingEvent.event_data as any as Mutation
            );
            for (const outcome of outcomes) {
                if (outcome._type === 'successful.applied.airtable.mapping') {
                    logger.info(`Successfully replicated event ${maybePendingEvent.id} as ${outcome.airtableOutcome.action} to ${airtableSystemName} ${outcome.airtableOutcome.baseId}/${outcome.airtableOutcome.table}/${outcome.airtableOutcome.recordId.value}`);
                } else if (outcome._type === 'airtable.client.failure') {
                    logger.error(`Failed to replicate event ${maybePendingEvent.id} to ${airtableSystemName} (${outcome.baseId}/${outcome.table}): ${outcome.error}`);
                } else {
                    logger.error(`Failed to replicate event ${maybePendingEvent.id} to ${airtableSystemName}: ${outcome.error}`);
                }
            }
            const firstError = outcomes.find((outcome) => outcome._type !== 'successful.applied.airtable.mapping') as AirtableClientFailure | FailedAppliedAirtableMapping | undefined;
            if (firstError) {
                throw new Error(`Failed to replicate event ${maybePendingEvent.id} to ${airtableSystemName}: ${firstError.error}`);
            }
            return outcomes
        });
        await inngestStep.run('markEventAsReplicated', async () => {
            logger.info(`Marking event ${maybePendingEvent.id} as replicated to ${airtableSystemName}`)
            await prisma.replicated_mutation_events.create({
                data: {
                    mutation_event_id: maybePendingEvent.id,
                    to_system: airtableSystemName
                }
            });
            logger.info(`Marked event ${maybePendingEvent.id} as replicated to ${airtableSystemName}`)
        });
        await inngestStep.run('queueAnotherPendingChange', async () => {
            await inngestStep.send({
                name: announceChangesToAirtable.onPendingChangeInTenantEnvironment,
                data: {tenantId, environmentId}
            });
        });
    } else {
        logger.info(`No more pending changes for tenant ${tenantId} environment ${environmentId}`);
    }
    await inngestStep.run('releaseLock', async () => {
        await releaseLock(prisma, tenantId, environmentId);
    });
}

const hardCodedMappingFinder: MappingPlanFinder = async (tenantId: string, environmentId: string) => {
    if (tenantId === 'tenant1' && environmentId === 'dev') {
        return carWashMapping;
    }
    if (tenantId === 'thesmartwashltd') {
        return natsCarWashAirtableMapping;
    }
    return null;
}

function baseIdReplacingMappingFinder(delegate: MappingPlanFinder): MappingPlanFinder {
    return async (tenantId: string, environmentId: string) => {
        const mapping = await delegate(tenantId, environmentId);
        if (mapping) {
            let asString = JSON.stringify(mapping);
            if(asString.includes('ENV.TEST_CARWASH_BASE_ID') && !process.env.TEST_CARWASH_BASE_ID) {
                throw new Error('Missing TEST_CARWASH_BASE_ID');
            }
            if(asString.includes('ENV.SMARTWASH_BASE_ID') && !process.env.SMARTWASH_BASE_ID) {
                throw new Error('Missing SMARTWASH_BASE_ID');
            }
            asString = asString.replaceAll('ENV.TEST_CARWASH_BASE_ID', process.env.TEST_CARWASH_BASE_ID ?? '');
            asString = asString.replaceAll('ENV.SMARTWASH_BASE_ID', process.env.SMARTWASH_BASE_ID ?? '');
            return JSON.parse(asString) as AirtableMappingPlan;
        }
        return null;
    }
}

export const onPendingChangeInTenantEnvironment = inngest.createFunction(
    {
        id: announceChangesToAirtable.onPendingChangeInTenantEnvironment,
        concurrency: {
            scope: 'env',
            key: `event.data.tenantId + "-" + event.data.environmentId`,
            limit: 1
        }
    },
    {event: announceChangesToAirtable.onPendingChangeInTenantEnvironment},
    async ({event, step, logger}) => {
        const {environmentId, tenantId} = event.data;
        const prisma = prismaClient();
        const prismaSynchronisationIdRepository = new PrismaSynchronisationIdRepository(prisma, tenantId, environmentId);
        const httpAirtableClient = new HttpAirtableClient('https://api.airtable.com/v0', new AirtableAccessTokenProvider(tenantId, environmentId));
        const inngestStep = new DelegatingInngestStep(inngest, step);
        await handlePendingChangeInTenantEnvironment(prisma, logger, baseIdReplacingMappingFinder(hardCodedMappingFinder), getEarliestNonReplicatedMutationEvent, prismaSynchronisationIdRepository, httpAirtableClient, tenantId, environmentId, inngestStep);
    }
);
