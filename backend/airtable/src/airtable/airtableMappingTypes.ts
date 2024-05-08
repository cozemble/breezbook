import {Entity} from '../mutation/mutations.js';
import {CompositeKey} from '../inngest/dataSynchronisation.js';

interface AirtableCreate {
    _type: 'airtable.create';
    baseId: string;
    table: string;
    fields: Record<string, FieldMapping | FieldMapping[]>;
}

interface AirtableUpdate {
    _type: 'airtable.update';
    baseId: string;
    table: string;
    fields: Record<string, FieldMapping | FieldMapping[]>;
}

interface AirtableUpsert {
    _type: 'airtable.upsert';
    baseId: string;
    table: string;
    fields: Record<string, FieldMapping | FieldMapping[]>;
}

export type AirtableMutation = AirtableUpsert | AirtableCreate | AirtableUpdate;

export interface AirtableRecordIdMapping {
    mappedTo: { entity: Entity; entityId: CompositeKey };
}

export interface AirtableMapping {
    recordId: AirtableRecordIdMapping;
    records: AirtableMutation[];
}

export interface Mapping {
    when: string;
    airtable: AirtableMapping;
}

export interface AirtableMappingPlan {
    _type: 'airtable.mapping.plan';
    mappings: Mapping[];
}

interface ObjectPath {
    _type: 'object.path';
    path: string;
    nullable?: boolean;
}

interface Expression {
    _type: 'expression';
    expression: string;
}

interface Lookup {
    _type: 'lookup';
    entity: Entity;
    entityId: CompositeKey | Record<string,any>;
    table: string;
    nullable?: boolean;
}

interface MappedMapping {
    _type: 'map';
    list: ObjectPath;
    variableName: string;
    fn: Lookup
}

export type FieldMapping = ObjectPath | Expression | Lookup | MappedMapping;

export type MappingPlanFinder = (tenantId: string, environmentId: string) => Promise<AirtableMappingPlan | null>

interface AirtableCreateCommand {
    _type: 'airtable.create.command';
    baseId: string;
    table: string;
    fields: Record<string, any>;
}

interface AirtableUpdateCommand {
    _type: 'airtable.update.command';
    baseId: string;
    table: string;
    fields: Record<string, any>;
}

interface AirtableUpsertCommand {
    _type: 'airtable.upsert.command';
    baseId: string;
    table: string;
    fields: Record<string, any>;
}

export function airtableCreateCommand(baseId: string, table: string, fields: Record<string, any>): AirtableCreateCommand {
    return {_type: 'airtable.create.command', baseId, table, fields};
}
export function airtableUpdateCommand(baseId: string, table: string, fields: Record<string, any>): AirtableUpdateCommand {
    return {_type: 'airtable.update.command', baseId, table, fields};
}

export function airtableUpsertCommand(baseId: string, table: string, fields: Record<string, any>): AirtableUpsertCommand {
    return {_type: 'airtable.upsert.command', baseId, table, fields};
}

export type AirtableMutationCommand = AirtableUpsertCommand | AirtableCreateCommand | AirtableUpdateCommand;
