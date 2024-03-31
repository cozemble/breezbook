import { id, Id } from '@breezbook/packages-core';
import { Entity } from '../mutation/mutations.js';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';

export interface SynchronisationIdRepository {
	getTargetId(sourceEntity: Entity, sourceEntityId: Id): Promise<Id | undefined>;
	setTargetId(sourceEntity: Entity, sourceEntityId: Id, targetId: Id): Promise<void>;
}

export class InMemorySynchronisationIdRepository implements SynchronisationIdRepository {
	private readonly synchronisationIds: Record<string, Id> = {};

	async getTargetId(sourceEntity: Entity, sourceEntityId: Id): Promise<Id | undefined> {
		return this.synchronisationIds[`${sourceEntity}-${sourceEntityId}`];
	}

	async setTargetId(sourceEntity: Entity, sourceEntityId: Id, targetId: Id): Promise<void> {
		this.synchronisationIds[`${sourceEntity}-${sourceEntityId}`] = targetId;
	}
}

export class PrismaSynchronisationIdRepository implements SynchronisationIdRepository {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly tenantId: string,
		private readonly environmentId: string
	) {}

	async getTargetId(sourceEntity: Entity, sourceEntityId: Id): Promise<Id | undefined> {
		const maybeExisting = await this.prisma.data_synchronisation_id_mappings.findUnique({
			where: {
				tenant_id_environment_id_entity_type_from_system_to_system_from_id: {
					tenant_id: this.tenantId,
					environment_id: this.environmentId,
					entity_type: sourceEntity,
					from_system: 'breezbook',
					to_system: 'airtable',
					from_id: sourceEntityId.value
				}
			}
		});
		return maybeExisting ? id(maybeExisting.to_id) : undefined;
	}

	async setTargetId(sourceEntity: Entity, sourceEntityId: Id, targetId: Id): Promise<void> {
		await this.prisma.data_synchronisation_id_mappings.upsert({
			where: {
				tenant_id_environment_id_entity_type_from_system_to_system_from_id: {
					tenant_id: this.tenantId,
					environment_id: this.environmentId,
					entity_type: sourceEntity,
					from_system: 'breezbook',
					to_system: 'airtable',
					from_id: sourceEntityId.value
				}
			},
			update: { to_id: targetId.value },
			create: {
				id: uuid(),
				tenant_id: this.tenantId,
				environment_id: this.environmentId,
				entity_type: sourceEntity,
				from_system: 'breezbook',
				to_system: 'airtable',
				from_id: sourceEntityId.value,
				to_id: targetId.value
			}
		});
	}
}
