import { Entity } from '../mutation/mutations.js';
import { CompositeKey } from '../inngest/dataSynchronisation.js';

interface AirtableCreate {
	_type: 'airtable.create';
	baseId: string;
	table: string;
	fields: Record<string, FieldMapping>;
}

interface AirtableUpdate {
	_type: 'airtable.update';
	baseId: string;
	table: string;
	fields: Record<string, FieldMapping>;
}

interface AirtableUpsert {
	_type: 'airtable.upsert';
	baseId: string;
	table: string;
	fields: Record<string, FieldMapping>;
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

export const carWashMapping: MappingPlan = {
	_type: 'mapping.plan',
	mappings: [
		{
			when: '_type == "upsert" && create.entity == "customers"',
			airtable: {
				recordId: { mappedTo: { entity: 'customers', entityId: { id: 'create.data.id' } } },
				records: [
					{
						_type: 'airtable.upsert',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Customers',
						fields: {
							'First name': { _type: 'object.path', path: 'create.data.first_name', nullable: false },
							'Last name': { _type: 'object.path', path: 'create.data.last_name', nullable: false },
							Email: { _type: 'object.path', path: 'create.data.email', nullable: false }
						}
					}
				]
			}
		},
		{
			when: '_type == "upsert" && create.entity == "customer_form_values"',
			airtable: {
				recordId: {
					mappedTo: {
						entity: 'customers',
						entityId: { id: 'create.data.customer_id' }
					}
				},
				records: [
					{
						_type: 'airtable.update',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Customers',
						fields: {
							Phone: { _type: 'object.path', path: 'create.data.form_values.phone', nullable: false }
						}
					}
				]
			}
		},
		{
			when: '_type == "create" && entity == "bookings"',
			airtable: {
				recordId: {
					mappedTo: {
						entity: 'bookings',
						entityId: { id: 'data.id' }
					}
				},
				records: [
					{
						_type: 'airtable.create',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Bookings',
						fields: {
							Customer: { _type: 'lookup', entity: 'customers', entityId: { id: 'data.customer_id' }, table: 'Customers', nullable: false },
							'Due Date': { _type: 'object.path', path: 'data.date' },
							Time: { _type: 'expression', expression: 'data.start_time_24hr + " to " + data.end_time_24hr' }
						}
					},
					{
						_type: 'airtable.create',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Booked services',
						fields: {
							Bookings: { _type: 'lookup', entity: 'bookings', entityId: { id: 'data.id' }, table: 'Bookings' },
							Service: { _type: 'lookup', entity: 'services', entityId: { id: 'data.service_id' }, table: 'Services' }
						}
					}
				]
			}
		},
		{
			when: '_type == "upsert" && create.entity == "booking_service_form_values"',
			airtable: {
				recordId: {
					mappedTo: {
						entity: 'bookings',
						entityId: { id: 'create.data.booking_id' }
					}
				},
				records: [
					{
						_type: 'airtable.upsert',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Car details',
						fields: {
							Make: { _type: 'object.path', path: 'create.data.service_form_values.make' },
							Model: { _type: 'object.path', path: 'create.data.service_form_values.model' },
							Year: { _type: 'object.path', path: 'create.data.service_form_values.year' },
							Colour: { _type: 'object.path', path: 'create.data.service_form_values.colour' }
						}
					},
					{
						_type: 'airtable.update',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Booked services',
						fields: {
							'Car details': {
								_type: 'lookup',
								entity: 'bookings',
								entityId: { id: 'create.data.booking_id' },
								table: 'Car details'
							}
						}
					}
				]
			}
		}
	]
};
