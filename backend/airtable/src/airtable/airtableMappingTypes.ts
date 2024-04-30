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

export interface MappingPlan {
	_type: 'mapping.plan';
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
	entityId: CompositeKey;
	table: string;
	nullable?: boolean;
}

export type FieldMapping = ObjectPath | Expression | Lookup;

