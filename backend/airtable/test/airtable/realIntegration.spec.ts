import { expect, test } from 'vitest';
import { Mutation } from '../../src/mutation/mutations.js';
import { CompositeKey, compositeKeyFns, InMemorySynchronisationIdRepository, SynchronisationIdRepository } from '../../src/inngest/dataSynchronisation.js';
import { id, ValueType } from '@breezbook/packages-core';
import { AirtableMapping, AirtableMutation, AirtableRecordIdMapping, carWashMapping, FieldMapping, MappingPlan } from '../../src/airtable/learningMapping.js';
import jexl from 'jexl';

const mutationEvents: Mutation[] = [
	{
		_type: 'upsert',
		create: {
			data: {
				id: '1e2e743d-d35d-494a-a8fc-572b6c0610df',
				email: 'mike@email.com',
				last_name: 'Hogan',
				tenant_id: 'tenant1',
				first_name: 'Mike',
				environment_id: 'dev'
			},
			_type: 'create',
			entity: 'customers',
			entityId: { _type: 'id', value: '1e2e743d-d35d-494a-a8fc-572b6c0610df' }
		},
		update: {
			data: { last_name: 'Hogan', tenant_id: 'tenant1', first_name: 'Mike' },
			_type: 'update',
			where: {
				tenant_id_environment_id_email: {
					email: 'mike@email.com',
					tenant_id: 'tenant1',
					environment_id: 'dev'
				}
			},
			entity: 'customers',
			entityId: { _type: 'id', value: '1e2e743d-d35d-494a-a8fc-572b6c0610df' }
		}
	},
	{
		_type: 'upsert',
		create: {
			data: {
				tenant_id: 'tenant1',
				customer_id: '1e2e743d-d35d-494a-a8fc-572b6c0610df',
				form_values: { phone: '23432432', postcode: 'X1Y2', firstLineOfAddress: '11 Main Street' },
				environment_id: 'dev'
			},
			_type: 'create',
			entity: 'customer_form_values',
			entityId: { _type: 'id', value: '1e2e743d-d35d-494a-a8fc-572b6c0610df' }
		},
		update: {
			data: {
				form_values: {
					phone: '23432432',
					postcode: 'X1Y2',
					firstLineOfAddress: '11 Main Street'
				}
			},
			_type: 'update',
			where: {
				tenant_id_environment_id_customer_id: {
					tenant_id: 'tenant1',
					customer_id: '1e2e743d-d35d-494a-a8fc-572b6c0610df',
					environment_id: 'dev'
				}
			},
			entity: 'customer_form_values',
			entityId: { _type: 'id', value: '1e2e743d-d35d-494a-a8fc-572b6c0610df' }
		}
	},
	{
		data: {
			id: 'a5b8c4b2-b9d2-4b73-bed5-ac5078d7f58f',
			tenant_id: 'tenant1',
			customer_id: '1e2e743d-d35d-494a-a8fc-572b6c0610df',
			environment_id: 'dev',
			total_price_currency: 'GBP',
			total_price_in_minor_units: 1400
		},
		_type: 'create',
		entity: 'orders',
		entityId: { _type: 'id', value: 'a5b8c4b2-b9d2-4b73-bed5-ac5078d7f58f' }
	},
	{
		data: {
			id: 'd3dab4e6-e569-461d-a4f7-21b06ccfce35',
			date: '2024-04-02',
			order_id: 'a5b8c4b2-b9d2-4b73-bed5-ac5078d7f58f',
			tenant_id: 'tenant1',
			add_on_ids: [],
			service_id: 'smallCarWash',
			time_slot_id: 'timeSlot#1',
			end_time_24hr: '13:00',
			environment_id: 'dev',
			start_time_24hr: '09:00'
		},
		_type: 'create',
		entity: 'order_lines',
		entityId: { _type: 'id', value: 'd3dab4e6-e569-461d-a4f7-21b06ccfce35' }
	},
	{
		data: {
			id: '050da0be-01f1-4246-8a2e-dd3f691f73fd',
			date: '2024-04-02',
			order_id: 'a5b8c4b2-b9d2-4b73-bed5-ac5078d7f58f',
			tenant_id: 'tenant1',
			add_on_ids: [],
			service_id: 'smallCarWash',
			customer_id: '1e2e743d-d35d-494a-a8fc-572b6c0610df',
			time_slot_id: 'timeSlot#1',
			end_time_24hr: '13:00',
			environment_id: 'dev',
			start_time_24hr: '09:00'
		},
		_type: 'create',
		entity: 'bookings',
		entityId: { _type: 'id', value: '050da0be-01f1-4246-8a2e-dd3f691f73fd' }
	},
	{
		data: {
			id: 'd473b8fa-e907-402f-8907-66d6e544b927',
			booking_id: '050da0be-01f1-4246-8a2e-dd3f691f73fd',
			expiry_time: '2024-04-02T11:38:04.477Z',
			reservation_time: '2024-04-02T11:08:04.477Z',
			reservation_type: 'awaiting payment'
		},
		_type: 'create',
		entity: 'reservations',
		entityId: { _type: 'id', value: 'd473b8fa-e907-402f-8907-66d6e544b927' }
	},
	{
		_type: 'upsert',
		create: {
			data: {
				tenant_id: 'tenant1',
				booking_id: '050da0be-01f1-4246-8a2e-dd3f691f73fd',
				environment_id: 'dev',
				service_form_id: 'car-details-form',
				service_form_values: { make: 'Honda', year: 2021, model: 'Accord', colour: 'Silver' }
			},
			_type: 'create',
			entity: 'booking_service_form_values',
			entityId: { _type: 'id', value: '050da0be-01f1-4246-8a2e-dd3f691f73fd' }
		},
		update: {
			data: {
				service_form_values: {
					make: 'Honda',
					year: 2021,
					model: 'Accord',
					colour: 'Silver'
				}
			},
			_type: 'update',
			where: {
				tenant_id_environment_id_booking_id_service_form_id: {
					tenant_id: 'tenant1',
					booking_id: '050da0be-01f1-4246-8a2e-dd3f691f73fd',
					environment_id: 'dev',
					service_form_id: 'car-details-form'
				}
			},
			entity: 'booking_service_form_values',
			entityId: { _type: 'id', value: '050da0be-01f1-4246-8a2e-dd3f691f73fd' }
		}
	}
];

export interface RecordId extends ValueType<string> {
	_type: 'recordId';
}

export interface AirtableClient {
	createRecord(baseId: string, table: string, fields: Record<string, any>): Promise<RecordId>;

	updateRecord(baseId: string, table: string, recordId: string, fields: Record<string, any>): Promise<void>;
}

export class StubAirtableClient implements AirtableClient {
	constructor(
		private recordIndex = 100,
		public records: { recordId: string; baseId: string; table: string; fields: Record<string, any> }[] = []
	) {}

	async createRecord(baseId: string, table: string, fields: Record<string, any>): Promise<RecordId> {
		const recordId = `rec` + this.recordIndex++;
		this.records.push({ recordId, baseId, table, fields });
		return { _type: 'recordId', value: recordId };
	}

	async updateRecord(baseId: string, table: string, recordId: string, fields: Record<string, any>): Promise<void> {
		const record = this.records.find((record) => record.recordId === recordId);
		if (!record) {
			throw new Error(`No such record with id ${recordId}`);
		}
		record.fields = { ...record.fields, ...fields };
		this.records = this.records.filter((record) => record.recordId !== recordId);
		this.records.push(record);
		return;
	}
}

async function applyFieldMappings(idRepo: SynchronisationIdRepository, mutation: Mutation, fields: Record<string, FieldMapping>): Promise<Record<string, any>> {
	const fieldValues: Record<string, any> = {};
	const jexlInstance = new jexl.Jexl();
	for (const [fieldName, fieldMapping] of Object.entries(fields)) {
		if (fieldMapping._type === 'object.path') {
			const value = jexlInstance.evalSync(fieldMapping.path, mutation);
			if (!fieldMapping.nullable) {
				if (value === undefined || value === null) {
					throw new Error(`Path '${fieldMapping.path}' in mutation of type ${mutation._type} is undefined or null`);
				}
			}
			fieldValues[fieldName] = value;
		} else if (fieldMapping._type === 'expression') {
			fieldValues[fieldName] = jexlInstance.evalSync(fieldMapping.expression, mutation);
		} else if (fieldMapping._type === 'lookup') {
			const filledEntityId = expandCompositeKey(fieldMapping.entityId, mutation);
			const targetId = await idRepo.getTargetId(fieldMapping.entity, filledEntityId, fieldMapping.table);
			if (!fieldMapping.nullable && !targetId) {
				throw new Error(`No target id for entity ${fieldMapping.entity}, key ${JSON.stringify(filledEntityId)}, table ${fieldMapping.table}`);
			}
			fieldValues[fieldName] = targetId?.value;
		}
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
		throw new Error(`No target id for entity ${recordId.mappedTo.entity}, key ${compositeKeyFns.toString(recordId.mappedTo.entityId)}, table ${record.table}`);
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

test('real integration from breezbook to airtable', async () => {
	const idRepo = new InMemorySynchronisationIdRepository();
	await idRepo.setTargetId('services', { id: 'smallCarWash' }, 'Services', id('rec1'));
	const stubAirtableClient = new StubAirtableClient();

	for (const mutation of mutationEvents) {
		await applyAirtablePlan(idRepo, stubAirtableClient, carWashMapping, mutation);
	}
	const customerRecord = stubAirtableClient.records.find((record) => record.table === 'Customers');
	expect(customerRecord).toBeDefined();
	expect(customerRecord!.fields).toEqual({
		'First name': 'Mike',
		'Last name': 'Hogan',
		Email: 'mike@email.com',
		Phone: '23432432'
	});
	const bookingRecord = stubAirtableClient.records.find((record) => record.table === 'Bookings');
	expect(bookingRecord).toBeDefined();
	expect(bookingRecord!.fields).toEqual({
		Customer: 'rec100',
		'Due Date': '2024-04-02',
		Time: '09:00 to 13:00'
	});
	const bookedServicesRecord = stubAirtableClient.records.find((record) => record.table === 'Booked services');
	expect(bookedServicesRecord).toBeDefined();
	expect(bookedServicesRecord!.fields).toEqual({
		Bookings: 'rec101',
		'Car details': 'rec103',
		Service: 'rec1'
	});
	const carDetailsRecord = stubAirtableClient.records.find((record) => record.table === 'Car details');
	expect(carDetailsRecord).toBeDefined();
	expect(carDetailsRecord!.fields).toEqual({
		Make: 'Honda',
		Model: 'Accord',
		Year: 2021,
		Colour: 'Silver'
	});
});
