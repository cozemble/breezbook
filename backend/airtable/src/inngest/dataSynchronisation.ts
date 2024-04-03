import { id, Id } from '@breezbook/packages-core';
import { Entity } from '../mutation/mutations.js';
import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';

export type CompositeKey = Record<string, string>;

export const compositeKeyFns = {
	toString: (key: CompositeKey): string => {
		const sortedKeys = Object.keys(key).sort();
		return sortedKeys.map((k) => key[k]).join('-');
	},
	newInstance(value: Record<string, string>) {
		return value;
	}
};

export interface SynchronisationIdRepository {
	getTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string): Promise<Id | undefined>;

	setTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string, targetId: Id): Promise<void>;
}

export class InMemorySynchronisationIdRepository implements SynchronisationIdRepository {
	private readonly synchronisationIds: Record<string, Id> = {};

	async getTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string): Promise<Id | undefined> {
		return this.synchronisationIds[`${sourceEntity}-${compositeKeyFns.toString(sourceEntityId)}-${targetEntity}`];
	}

	async setTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string, targetId: Id): Promise<void> {
		this.synchronisationIds[`${sourceEntity}-${compositeKeyFns.toString(sourceEntityId)}-${targetEntity}`] = targetId;
	}
}

export class PrismaSynchronisationIdRepository implements SynchronisationIdRepository {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly tenantId: string,
		private readonly environmentId: string
	) {}

	async getTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string): Promise<Id | undefined> {
		const maybeExisting = await this.prisma.data_synchronisation_id_mappings.findUnique({
			where: {
				tenant_id_environment_id_from_system_from_entity_type_from_entity_id_to_system_to_entity_type: {
					tenant_id: this.tenantId,
					environment_id: this.environmentId,
					from_system: 'breezbook',
					from_entity_type: sourceEntity,
					from_entity_id: compositeKeyFns.toString(sourceEntityId),
					to_system: 'airtable',
					to_entity_type: targetEntity
				}
			}
		});
		return maybeExisting ? id(maybeExisting.to_entity_id) : undefined;
	}

	async setTargetId(sourceEntity: Entity, sourceEntityId: CompositeKey, targetEntity: string, targetId: Id): Promise<void> {
		await this.prisma.data_synchronisation_id_mappings.upsert({
			where: {
				tenant_id_environment_id_from_system_from_entity_type_from_entity_id_to_system_to_entity_type: {
					tenant_id: this.tenantId,
					environment_id: this.environmentId,
					from_system: 'breezbook',
					from_entity_type: sourceEntity,
					from_entity_id: compositeKeyFns.toString(sourceEntityId),
					to_system: 'airtable',
					to_entity_type: targetEntity
				}
			},
			update: { to_entity_id: targetId.value },
			create: {
				id: uuid(),
				tenant_id: this.tenantId,
				environment_id: this.environmentId,
				from_system: 'breezbook',
				from_entity_type: sourceEntity,
				from_entity_id: compositeKeyFns.toString(sourceEntityId),
				to_system: 'airtable',
				to_entity_type: targetEntity,
				to_entity_id: targetId.value
			}
		});
	}
}
