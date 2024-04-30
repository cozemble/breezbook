import { CompositeKey, compositeKeyFns, SynchronisationIdRepository } from '../inngest/dataSynchronisation.js';
import { AirtableClient } from './airtableClient.js';
import { AirtableMapping, AirtableMutation, AirtableRecordIdMapping, FieldMapping, MappingPlan } from './airtableMappingTypes.js';
import { Mutation } from '../mutation/mutations.js';
import { id } from '@breezbook/packages-core';
import jexl from 'jexl';

export async function applyAirtablePlan(
	idRepo: SynchronisationIdRepository,
	airtableClient: AirtableClient,
	mapping: MappingPlan,
	mutation: Mutation
): Promise<void> {
	const jexlInstance = new jexl.Jexl();
	const maybeMapping = mapping.mappings.find((mapping) => jexlInstance.evalSync(mapping.when, mutation));
	if (maybeMapping) {
		await applyAirtableMapping(idRepo, airtableClient, mutation, maybeMapping.airtable);
	}
}

async function dereferenceFieldMapping(
	idRepo: SynchronisationIdRepository,
	fieldMapping: FieldMapping | FieldMapping[],
	mutation: Mutation
	// fieldValues: Record<string, any>,
	// fieldName: string,
): Promise<any> {
	if (Array.isArray(fieldMapping)) {
		return await Promise.all(
			fieldMapping.map(async (fieldMapping) => {
				return await dereferenceFieldMapping(idRepo, fieldMapping, mutation);
			})
		);
	}
	const jexlInstance = new jexl.Jexl();

	if (fieldMapping._type === 'object.path') {
		const value = jexlInstance.evalSync(fieldMapping.path, mutation);
		if (!fieldMapping.nullable && (value === undefined || value === null)) {
			throw new Error(`Path '${fieldMapping.path}' in mutation of type ${mutation._type} is undefined or null`);
		}
		return value;
	} else if (fieldMapping._type === 'expression') {
		return jexlInstance.evalSync(fieldMapping.expression, mutation);
	} else if (fieldMapping._type === 'lookup') {
		const filledEntityId = expandCompositeKey(fieldMapping.entityId, mutation);
		const targetId = await idRepo.getTargetId(fieldMapping.entity, filledEntityId, fieldMapping.table);
		if (!fieldMapping.nullable && !targetId) {
			throw new Error(
				`While processing lookup ${JSON.stringify(fieldMapping)},no target id for entity ${fieldMapping.entity}, key ${JSON.stringify(filledEntityId)}, table ${
					fieldMapping.table
				}`
			);
		}
		return targetId?.value;
	} else {
		throw new Error(`Unknown field mapping type ${JSON.stringify(fieldMapping)}`);
	}
}

async function applyFieldMappings(
	idRepo: SynchronisationIdRepository,
	mutation: Mutation,
	fields: Record<string, FieldMapping | FieldMapping[]>
): Promise<Record<string, any>> {
	const fieldValues: Record<string, any> = {};
	for (const [fieldName, fieldMapping] of Object.entries(fields)) {
		fieldValues[fieldName] = await dereferenceFieldMapping(idRepo, fieldMapping, mutation);
	}
	return fieldValues;
}

async function applyAirtableCreate(
	idRepo: SynchronisationIdRepository,
	airtableClient: AirtableClient,
	mutation: Mutation,
	recordId: AirtableRecordIdMapping,
	record: AirtableMutation
): Promise<void> {
	const fieldValues = await applyFieldMappings(idRepo, mutation, record.fields);
	const recId = await airtableClient.createRecord(record.baseId, record.table, fieldValues);
	await idRepo.setTargetId(recordId.mappedTo.entity, recordId.mappedTo.entityId, record.table, id(recId.value));
}

async function applyAirtableUpdate(
	idRepo: SynchronisationIdRepository,
	airtableClient: AirtableClient,
	mutation: Mutation,
	recordId: AirtableRecordIdMapping,
	record: AirtableMutation
): Promise<void> {
	const targetId = await idRepo.getTargetId(recordId.mappedTo.entity, recordId.mappedTo.entityId, record.table);
	if (!targetId) {
		throw new Error(
			`While applying  ${record._type} to table '${record.table}', no target id for entity '${recordId.mappedTo.entity}', key '${compositeKeyFns.toString(
				recordId.mappedTo.entityId
			)}', table '${record.table}'`
		);
	}
	const fieldValues = await applyFieldMappings(idRepo, mutation, record.fields);
	await airtableClient.updateRecord(record.baseId, record.table, targetId.value, fieldValues);
}

async function applyAirtableUpsert(
	idRepo: SynchronisationIdRepository,
	airtableClient: AirtableClient,
	mutation: Mutation,
	recordId: AirtableRecordIdMapping,
	record: AirtableMutation
): Promise<void> {
	const targetId = await idRepo.getTargetId(recordId.mappedTo.entity, recordId.mappedTo.entityId, record.table);
	if (targetId) {
		await applyAirtableUpdate(idRepo, airtableClient, mutation, recordId, record);
	} else {
		await applyAirtableCreate(idRepo, airtableClient, mutation, recordId, record);
	}
}

async function applyAirtableRecord(
	idRepo: SynchronisationIdRepository,
	airtableClient: AirtableClient,
	mutation: Mutation,
	recordId: AirtableRecordIdMapping,
	record: AirtableMutation
): Promise<void> {
	if (record._type === 'airtable.upsert') {
		return applyAirtableUpsert(idRepo, airtableClient, mutation, recordId, record);
	} else if (record._type === 'airtable.update') {
		return applyAirtableUpdate(idRepo, airtableClient, mutation, recordId, record);
	} else {
		return applyAirtableCreate(idRepo, airtableClient, mutation, recordId, record);
	}
}

function expandCompositeKey(compositeKey: CompositeKey, mutation: Mutation): CompositeKey {
	const jexlInstance = new jexl.Jexl();
	const expanded: Record<string, any> = {};
	for (const [key, value] of Object.entries(compositeKey)) {
		const keyValue = jexlInstance.evalSync(value, mutation);
		if (keyValue === undefined || keyValue === null) {
			throw new Error(`Path '${value}' in mutation of type ${mutation._type} is undefined or null`);
		}
		expanded[key] = keyValue;
	}
	return expanded;
}

async function applyAirtableMapping(
	idRepo: SynchronisationIdRepository,
	airtableClient: AirtableClient,
	mutation: Mutation,
	airtable: AirtableMapping
): Promise<void> {
	const expandedEntityId = expandCompositeKey(airtable.recordId.mappedTo.entityId, mutation);
	const recordId = { mappedTo: { entity: airtable.recordId.mappedTo.entity, entityId: expandedEntityId } };
	for (const record of airtable.records) {
		await applyAirtableRecord(idRepo, airtableClient, mutation, recordId, record);
	}
}
