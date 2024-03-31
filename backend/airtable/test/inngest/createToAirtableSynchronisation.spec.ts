import { describe, expect, test } from 'vitest';
import { InMemorySynchronisationIdRepository } from '../../src/inngest/dataSynchronisation.js';
import { airtableCreate, airtableUpdate, createToAirtableSynchronisation, toAirtableSynchronisation } from '../../src/inngest/airtableSynchronisation.js';
import { create, update, upsert } from '../../src/mutation/mutations.js';
import { id } from '@breezbook/packages-core';
import { airtableMapping, byNameFieldMapping } from '../../src/airtable/mappings.js';

describe('Given a customer upsert and airtable mapping', () => {
	const repo = new InMemorySynchronisationIdRepository();
	const theUpsert = upsert(
		create('customers', id('234'), { id: '123', firstName: 'John', lastName: 'Doe' }),
		update('customers', id('234'), { firstName: 'John', lastName: 'Doe' })
	);
	const customerMapping = airtableMapping('appTestBase', 'Customers', 'tenant1', 'dev', 'customers', [
		byNameFieldMapping('First name', 'firstName'),
		byNameFieldMapping('Last name', 'lastName')
	]);

	test('upsert of new record results in create mutation', async () => {
		const mutations = await createToAirtableSynchronisation(theUpsert, customerMapping, repo);
		expect(mutations).toEqual([
			toAirtableSynchronisation(
				airtableCreate('appTestBase', 'Customers', {
					'First name': 'John',
					'Last name': 'Doe'
				}),
				'customers',
				id('234')
			)
		]);
	});

	test('upsert of existing record results in an update mutation', async () => {
		repo.setTargetId('customers', id('123'), id('rec23432'));
		const mutations = await createToAirtableSynchronisation(theUpsert, customerMapping, repo);
		expect(mutations).toEqual([
			toAirtableSynchronisation(
				airtableUpdate('appTestBase', 'Customers', 'rec23432', {
					'First name': 'John',
					'Last name': 'Doe'
				}),
				'customers',
				id('234')
			)
		]);
	});
});
