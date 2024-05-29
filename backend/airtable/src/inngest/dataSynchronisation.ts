import {CompositeKey, compositeKeyFns, Entity} from '../mutation/mutations.js';
import {PrismaClient} from '@prisma/client';
import {v4 as uuid} from 'uuid';
import {airtableSystemName} from "../express/oauth/airtableConnect.js";


export interface SynchronisationIdRepository {
    getTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string): Promise<CompositeKey | undefined>;

    setTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string, targetId: CompositeKey): Promise<void>;
}

export class InMemorySynchronisationIdRepository implements SynchronisationIdRepository {
    private readonly synchronisationIds: Record<string, CompositeKey> = {};

    async getTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string): Promise<CompositeKey | undefined> {
        return this.synchronisationIds[`${sourceEntity}-${compositeKeyFns.toString(sourceEntityId)}-${targetEntity}`];
    }

    async setTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string, targetId: CompositeKey): Promise<void> {
        this.synchronisationIds[`${sourceEntity}-${compositeKeyFns.toString(sourceEntityId)}-${targetEntity}`] = targetId;
    }
}

export class PrismaSynchronisationIdRepository implements SynchronisationIdRepository {
    constructor(
        private readonly prisma: PrismaClient,
        private readonly tenantId: string,
        private readonly environmentId: string
    ) {
    }

    async getTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string): Promise<CompositeKey | undefined> {
        const maybeExisting = await this.prisma.data_synchronisation_id_mappings.findUnique({
            where: {
                tenant_id_environment_id_from_system_from_entity_type_from_entity_id_to_system_to_entity_type: {
                    tenant_id: this.tenantId,
                    environment_id: this.environmentId,
                    from_system: 'breezbook',
                    from_entity_type: sourceEntity,
                    from_entity_id: compositeKeyFns.toString(sourceEntityId),
                    to_system: airtableSystemName,
                    to_entity_type: targetEntity
                }
            }
        });
        return maybeExisting ? JSON.parse(maybeExisting.to_entity_id) as CompositeKey : undefined;
    }

    async setTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string, targetId: CompositeKey): Promise<void> {
        await this.prisma.data_synchronisation_id_mappings.upsert({
            where: {
                tenant_id_environment_id_from_system_from_entity_type_from_entity_id_to_system_to_entity_type: {
                    tenant_id: this.tenantId,
                    environment_id: this.environmentId,
                    from_system: 'breezbook',
                    from_entity_type: sourceEntity,
                    from_entity_id: compositeKeyFns.toString(sourceEntityId),
                    to_system: airtableSystemName,
                    to_entity_type: targetEntity
                }
            },
            update: {to_entity_id: JSON.stringify(targetId)},
            create: {
                id: uuid(),
                tenant_id: this.tenantId,
                environment_id: this.environmentId,
                from_system: 'breezbook',
                from_entity_type: sourceEntity,
                from_entity_id: compositeKeyFns.toString(sourceEntityId),
                to_system: airtableSystemName,
                to_entity_type: targetEntity,
                to_entity_id: JSON.stringify(targetId)
            }
        });
    }
}
