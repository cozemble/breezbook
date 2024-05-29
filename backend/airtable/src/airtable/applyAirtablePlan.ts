import {SynchronisationIdRepository} from '../inngest/dataSynchronisation.js';
import {AirtableClient, AirtableClientFailure, AirtableClientSuccess} from './airtableClient.js';
import {
    airtableCreateCommand,
    AirtableMapping,
    AirtableMappingPlan,
    AirtableMutation,
    AirtableMutationCommand,
    AirtableRecordIdMapping,
    airtableUpdateCommand,
    airtableUpsertCommand,
    FieldMapping
} from './airtableMappingTypes.js';
import {CompositeKey, compositeKey, compositeKeyFns, Mutation} from '../mutation/mutations.js';
import jexl from 'jexl';
import {mandatory} from "@breezbook/packages-core";

export async function applyAirtablePlan(
    idRepo: SynchronisationIdRepository,
    airtableClient: AirtableClient,
    mapping: AirtableMappingPlan,
    mutation: Mutation
): Promise<AppliedAirtableOutcome[]> {
    const jexlInstance = new jexl.Jexl();
    const maybeMapping = mapping.mappings.find((mapping) => jexlInstance.evalSync(mapping.when, mutation));
    if (maybeMapping) {
        return await applyAirtableMapping(idRepo, airtableClient, mutation, maybeMapping.airtable);
    }
    return []
}

function applyVariables(compositeKey: Record<string, any>, variables: Record<string, any>): CompositeKey {
    return Object.fromEntries(Object.entries(compositeKey).map(([key, value]) => {
        if (typeof value === 'object' && "variable" in value) {
            return [key, variables[value.variable]];
        }
        return [key, value];
    }));
}

async function dereferenceFieldMapping(
    idRepo: SynchronisationIdRepository,
    fieldMapping: FieldMapping | FieldMapping[],
    mutation: Mutation
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
        const targetId = await idRepo.getTargetId(fieldMapping.entity, filledEntityId, fieldMapping.table).then(k => k ? airtableRecordIdFns.fromCompositeKey(k) : null);
        if (!fieldMapping.nullable && !targetId) {
            throw new Error(
                `While processing lookup ${JSON.stringify(fieldMapping)},no target id for entity ${fieldMapping.entity}, key ${JSON.stringify(filledEntityId)}, table ${
                    fieldMapping.table
                }`
            );
        }
        return targetId;
    } else if (fieldMapping._type === 'map') {
        const list = jexlInstance.evalSync(fieldMapping.list.path, mutation);
        if (!list) {
            throw new Error(`Path '${fieldMapping.list.path}' in mutation of type ${mutation._type} is undefined or null`);
        }
        return await Promise.all(
            list.map(async (item: any) => {
                const variableName = fieldMapping.variableName;
                const lookup = fieldMapping.fn;
                const variables = {[variableName]: item}
                const filledEntityId = expandCompositeKey(lookup.entityId, item, variables);
                const targetId = await idRepo.getTargetId(lookup.entity, filledEntityId, lookup.table)
                    .then(k => k ? airtableRecordIdFns.fromCompositeKey(k) : null)
                if (!lookup.nullable && !targetId) {
                    throw new Error(
                        `While processing map ${JSON.stringify(fieldMapping)},no target id for entity ${lookup.entity}, key ${JSON.stringify(filledEntityId)}, table ${
                            lookup.table
                        }`
                    );
                }
                return targetId
            })
        );
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

export interface SuccessfulAppliedAirtableMapping {
    _type: 'successful.applied.airtable.mapping';
    airtableOutcome: AirtableClientSuccess
    mappedTo: AirtableRecordIdMapping
}

export function successfulAppliedAirtableMapping(airtableOutcome: AirtableClientSuccess, mappedTo: AirtableRecordIdMapping): SuccessfulAppliedAirtableMapping {
    return {_type: 'successful.applied.airtable.mapping', airtableOutcome, mappedTo};
}

export interface FailedAppliedAirtableMapping {
    _type: 'failed.applied.airtable.mapping'
    error: string,
    fieldValues: any
}

export function failedAppliedAirtableMapping(error: string, fieldValues: any): FailedAppliedAirtableMapping {
    return {_type: 'failed.applied.airtable.mapping', error, fieldValues};
}

export type AppliedAirtableOutcome =
    SuccessfulAppliedAirtableMapping
    | FailedAppliedAirtableMapping
    | AirtableClientFailure

export const airtableRecordIdFns = {
    toCompositeKey(airtableRecordId: string) {
        return compositeKey("airtableRecordId", airtableRecordId);
    },

    fromCompositeKey(compositeKey: CompositeKey): string {
        if("airtableRecordId" in compositeKey) {
            return compositeKey.airtableRecordId;
        }
        throw new Error(`Composite key ${JSON.stringify(compositeKey)} is not an airtable record id`);
    }
}

async function applyAirtableCreate(
    idRepo: SynchronisationIdRepository,
    airtableClient: AirtableClient,
    mutation: Mutation,
    recordId: AirtableRecordIdMapping,
    record: AirtableMutation
): Promise<AppliedAirtableOutcome> {
    const fieldValues = await applyFieldMappings(idRepo, mutation, record.fields);
    const outcome = await airtableClient.createRecord(record.baseId, record.table, fieldValues);
    if (outcome._type === 'airtable.client.failure') {
        return outcome;
    }
    await idRepo.setTargetId(recordId.mappedTo.entity, recordId.mappedTo.entityId, record.table, airtableRecordIdFns.toCompositeKey(outcome.recordId.value));
    return successfulAppliedAirtableMapping(outcome, recordId)
}

export async function mutationPlanToMutationCommand(idRepo: SynchronisationIdRepository, mutation: Mutation, mutationPlan: AirtableMutation): Promise<AirtableMutationCommand> {
    const fieldValues = await applyFieldMappings(idRepo, mutation, mutationPlan.fields);
    if (mutationPlan._type === 'airtable.create') {
        return airtableCreateCommand(mutationPlan.baseId, mutationPlan.table, fieldValues);
    } else if (mutationPlan._type === 'airtable.update') {
        return airtableUpdateCommand(mutationPlan.baseId, mutationPlan.table, fieldValues);
    } else {
        return airtableUpsertCommand(mutationPlan.baseId, mutationPlan.table, fieldValues);
    }
}

async function applyAirtableUpdate(
    idRepo: SynchronisationIdRepository,
    airtableClient: AirtableClient,
    mutation: Mutation,
    recordId: AirtableRecordIdMapping,
    record: AirtableMutation
): Promise<AppliedAirtableOutcome> {
    const fieldValues = await applyFieldMappings(idRepo, mutation, record.fields);
    const targetId = await idRepo.getTargetId(recordId.mappedTo.entity, recordId.mappedTo.entityId, record.table);
    if (!targetId) {
        return failedAppliedAirtableMapping(`While applying  ${record._type} to table '${record.table}', no target id for entity '${recordId.mappedTo.entity}', key '${compositeKeyFns.toString(
            recordId.mappedTo.entityId
        )}', table '${record.table}'`, fieldValues)
    }
    const airtableRecordId = airtableRecordIdFns.fromCompositeKey(targetId);
    const outcome = await airtableClient.updateRecord(record.baseId, record.table, airtableRecordId, fieldValues);
    if (outcome._type === 'airtable.client.failure') {
        return outcome;
    }
    return successfulAppliedAirtableMapping(outcome, recordId)
}

async function applyAirtableUpsert(
    idRepo: SynchronisationIdRepository,
    airtableClient: AirtableClient,
    mutation: Mutation,
    recordId: AirtableRecordIdMapping,
    record: AirtableMutation
): Promise<AppliedAirtableOutcome> {
    const targetId = await idRepo.getTargetId(recordId.mappedTo.entity, recordId.mappedTo.entityId, record.table);
    if (targetId) {
        return await applyAirtableUpdate(idRepo, airtableClient, mutation, recordId, record);
    } else {
        return await applyAirtableCreate(idRepo, airtableClient, mutation, recordId, record);
    }
}

async function applyAirtableRecord(
    idRepo: SynchronisationIdRepository,
    airtableClient: AirtableClient,
    mutation: Mutation,
    recordId: AirtableRecordIdMapping,
    record: AirtableMutation
): Promise<AppliedAirtableOutcome> {
    try {
        if (record._type === 'airtable.upsert') {
            return await applyAirtableUpsert(idRepo, airtableClient, mutation, recordId, record);
        } else if (record._type === 'airtable.update') {
            return await applyAirtableUpdate(idRepo, airtableClient, mutation, recordId, record);
        } else {
            return await applyAirtableCreate(idRepo, airtableClient, mutation, recordId, record);
        }
    } catch (e: any) {
        return failedAppliedAirtableMapping(`While processing airtable mutation '${record._type}' on '${record.baseId}/${record.table}': ${e.message}`, {"airtableFields": "unknown"});
    }
}

function expandCompositeKey(compositeKey: Record<string, any>, mutation: Mutation, variables: Record<string, string> = {}): CompositeKey {
    const jexlInstance = new jexl.Jexl();
    const expanded: Record<string, any> = {};
    for (const [key, value] of Object.entries(compositeKey)) {
        if (typeof value === 'object' && "variable" in value) {
            expanded[key] = variables[value.variable];
            continue;
        }
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
): Promise<AppliedAirtableOutcome[]> {
    const expandedEntityId = expandCompositeKey(airtable.recordId.mappedTo.entityId, mutation);
    const recordId = {mappedTo: {entity: airtable.recordId.mappedTo.entity, entityId: expandedEntityId}};
    const outcomes: AppliedAirtableOutcome[] = [];
    for (const record of airtable.records) {
        const outcome = await applyAirtableRecord(idRepo, airtableClient, mutation, recordId, record);
        outcomes.push(outcome);
    }
    return outcomes;
}

async function planSingleMutation(
    idRepo: SynchronisationIdRepository,
    mutation: Mutation,
    airtable: AirtableMapping
): Promise<AirtableMutationCommand[]> {
    return await Promise.all(airtable.records.map(async (record) => await mutationPlanToMutationCommand(idRepo, mutation, record)));
}
