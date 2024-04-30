import {expect, test} from 'vitest';
import {InMemorySynchronisationIdRepository} from '../../src/inngest/dataSynchronisation.js';
import {id} from '@breezbook/packages-core';
import {StubAirtableClient} from '../../src/airtable/airtableClient.js';
import {applyAirtablePlan} from '../../src/airtable/applyAirtablePlan.js';
import {carWashMapping} from "../../src/airtable/carWashMapping.js";
import {exemplarBookingMutations} from "./exemplarBookingMutations.js";

test('real integration from breezbook to airtable', async () => {
	const idRepo = new InMemorySynchronisationIdRepository();
	await idRepo.setTargetId('services', { id: 'smallCarWash' }, 'Services', id('rec1'));
	const stubAirtableClient = new StubAirtableClient();

	for (const mutation of exemplarBookingMutations) {
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
