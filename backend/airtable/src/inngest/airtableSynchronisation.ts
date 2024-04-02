import { Create, Entity, Mutation, Update, Upsert } from '../mutation/mutations.js';
import { AirtableMapping } from '../airtable/mappings.js';
import { id, Id } from '@breezbook/packages-core';
import { SynchronisationIdRepository } from './dataSynchronisation.js';

interface AirtableCreate {
	_type: 'airtable.create';
	baseId: string;
	table: string;
	fields: Record<string, any>;
}

interface AirtableUpdate {
	_type: 'airtable.update';
	baseId: string;
	table: string;
	recordId: string;
	fields: Record<string, any>;
}

interface AirtableUpsert {
	_type: 'airtable.upsert';
	baseId: string;
	table: string;
	recordId: string;
	create: AirtableCreate;
	update: AirtableUpdate;
}

export function airtableCreate(baseId: string, table: string, fields: Record<string, any>): AirtableCreate {
	return { _type: 'airtable.create', baseId, table, fields };
}

export function airtableUpdate(baseId: string, table: string, recordId: string, fields: Record<string, any>): AirtableUpdate {
	return { _type: 'airtable.update', baseId, table, recordId, fields };
}

// export function airtableUpsert(baseId: string, table: string, recordId: string, create: AirtableCreate, update: AirtableUpdate): AirtableUpsert {
// 	return { _type: 'airtable.upsert', baseId, table, recordId, create, update };
// }

// type AirtableMutation = AirtableCreate | AirtableUpdate | AirtableUpsert;
type AirtableMutation = AirtableCreate | AirtableUpdate;

export interface ToAirtableSynchronisation {
	_type: 'to.airtable.synchronisation';
	airtableMutation: AirtableMutation;
	sourceEntity: Entity;
	sourceEntityId: Id;
}

export function toAirtableSynchronisation(airtableMutation: AirtableMutation, sourceEntity: Entity, sourceEntityId: Id): ToAirtableSynchronisation {
	return { _type: 'to.airtable.synchronisation', airtableMutation, sourceEntity, sourceEntityId };
}

function toAirtableCreateSync(mapping: AirtableMapping, event: Create<any>): ToAirtableSynchronisation[] {
	const fields = mapping.fieldMappings.map((field) => {
		const value = event.data[field.sourceFieldName];
		return { [field.targetFieldName]: value };
	});
	const create = airtableCreate(mapping.airtableBaseId, mapping.airtableTableName, Object.assign({}, ...fields));
	return [toAirtableSynchronisation(create, event.entity, event.entityId)];
}

function toAirtableUpdateSync(mapping: AirtableMapping, event: Update<any, any>, targetId: Id): ToAirtableSynchronisation[] {
	const fields = mapping.fieldMappings.map((field) => {
		const value = event.data[field.sourceFieldName];
		return { [field.targetFieldName]: value };
	});
	const update = airtableUpdate(mapping.airtableBaseId, mapping.airtableTableName, targetId.value, Object.assign({}, ...fields));
	return [toAirtableSynchronisation(update, event.entity, event.entityId)];
}

async function toAirtableUpsert(
	mapping: AirtableMapping,
	event: Upsert<any, any, any>,
	repo: SynchronisationIdRepository
): Promise<ToAirtableSynchronisation[]> {
	// const targetId = await repo.getTargetId(event.create.entity, event.create.entityId);
	const targetId = id('to do');
	if (targetId) {
		return toAirtableUpdateSync(mapping, event.update, targetId);
	}
	return toAirtableCreateSync(mapping, event.create);
}

export async function createToAirtableSynchronisation(
	event: Mutation,
	mapping: AirtableMapping,
	repo: SynchronisationIdRepository
): Promise<ToAirtableSynchronisation[]> {
	if (event._type === 'create') {
		return toAirtableCreateSync(mapping, event);
	}
	if (event._type === 'upsert') {
		return await toAirtableUpsert(mapping, event, repo);
	}
	return [];
}
