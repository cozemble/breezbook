import { expect, test } from 'vitest';
import { Mutation } from '../../src/mutation/mutations.js';
import { InMemorySynchronisationIdRepository } from '../../src/inngest/dataSynchronisation.js';
import { id } from '@breezbook/packages-core';
import { StubAirtableClient } from '../../src/airtable/airtableClient.js';
import { applyAirtablePlan } from '../../src/airtable/applyAirtablePlan.js';
import {carWashMapping} from "../../src/airtable/carWashMapping.js";

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
		Customer: ['rec100'],
		'Due Date': '2024-04-02',
		Time: '09:00 to 13:00'
	});
	const bookedServicesRecord = stubAirtableClient.records.find((record) => record.table === 'Booked services');
	expect(bookedServicesRecord).toBeDefined();
	expect(bookedServicesRecord!.fields).toEqual({
		Bookings: ['rec101'],
		'Car details': ['rec103'],
		Service: ['rec1']
	});
	const carDetailsRecord = stubAirtableClient.records.find((record) => record.table === 'Car details');
	expect(carDetailsRecord).toBeDefined();
	expect(carDetailsRecord!.fields).toEqual({
		Make: 'Honda',
		Model: 'Accord',
		'Year and colour': '2021 Silver'
	});
});
