import { Entity } from '../mutation/mutations.js';

export interface ByNameFieldMapping {
	_type: 'by.name.field.mapping';
	targetFieldName: string;
	sourceFieldName: string;
}

export function byNameFieldMapping(targetFieldName: string, sourceFieldName: string): ByNameFieldMapping {
	return { _type: 'by.name.field.mapping', targetFieldName, sourceFieldName };
}

export type FieldMapping = ByNameFieldMapping;

export interface AirtableMapping {
	_type: 'airtable.mapping';
	airtableBaseId: string;
	airtableTableName: string;
	tenantId: string;
	environmentId: string;
	entityType: Entity;
	fieldMappings: FieldMapping[];
}
