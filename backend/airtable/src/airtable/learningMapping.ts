import { Entity } from '../mutation/mutations.js';

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
	fields: Record<string, any>;
}

interface AirtableUpsert {
	_type: 'airtable.upsert';
	baseId: string;
	table: string;
	fields: Record<string, any>;
}
type AirtableMutation = AirtableUpsert | AirtableCreate | AirtableUpdate;

interface ObjectPath {
	path: string;
}

interface AirtableMapping {
	_type: 'airtable.mapping';
	sourceEntity: Entity;
	sourceEntityId: ObjectPath;
	airtableMutation: AirtableMutation;
}
interface Mapping {
	when: string[];
	airtable: AirtableMapping[];
}
interface MappingPlan {
	_type: 'mapping.plan';
	mappings: Mapping[];
}

export const mapping: MappingPlan = {
	_type: 'mapping.plan',
	mappings: [
		{
			when: ['_type == "upsert" && entity == "customer"'],
			airtable: [
				{
					_type: 'airtable.mapping',
					sourceEntity: 'customers',
					sourceEntityId: { path: 'entityId.value' },
					airtableMutation: {
						_type: 'airtable.upsert',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Customers',
						fields: {
							'First name': { path: 'create.data.first_name' },
							'Last name': { path: 'create.data.last_name' },
							Email: { path: 'create.data.email' }
						}
					}
				}
			]
		},
		{
			when: ['_type == "upsert" && entity == "customer_form_values"'],
			airtable: [
				{
					_type: 'airtable.mapping',
					sourceEntity: 'customers',
					sourceEntityId: { path: 'entityId.value' },
					airtableMutation: {
						_type: 'airtable.update',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Customers',
						fields: {
							Email: { path: 'create.data.email' }
						}
					}
				}
			]
		},
		{
			when: ['_type == "create" && entity == "bookings"'],
			airtable: [
				{
					_type: 'airtable.mapping',
					sourceEntity: 'bookings',
					sourceEntityId: { path: 'entityId.value' },
					airtableMutation: {
						_type: 'airtable.create',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Bookings',
						fields: {
							Customer: { pk: 'data.customer_id' },
							'Due Date': { path: 'data.date' },
							Time: { expression: 'data.start_time_24hr + " to " + data.end_time_24hr' }
						}
					}
				},
				{
					_type: 'airtable.mapping',
					sourceEntity: 'bookings',
					sourceEntityId: { path: 'entityId.value' },
					airtableMutation: {
						_type: 'airtable.create',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Booked services',
						fields: {
							Bookings: [{ pk: 'data.id' }]
						}
					}
				}
			]
		},
		{
			when: ['_type == "upsert" && entity == "booking_service_form_values"'],
			airtable: [
				{
					_type: 'airtable.mapping',
					sourceEntity: 'bookings',
					sourceEntityId: { path: 'create.data.bookingId' },
					airtableMutation: {
						_type: 'airtable.update',
						baseId: 'appn1dysBKgmD9nhI',
						table: 'Bookings',
						fields: {
							Customer: { pk: 'data.customer_id' },
							'Booked services': [{ pk: 'data.service_id' }],
							'Due Date': { path: 'data.date' },
							Time: { expression: 'data.start_time_24hr + " to " + data.end_time_24hr' }
						}
					}
				}
			]
		}
	]
};
