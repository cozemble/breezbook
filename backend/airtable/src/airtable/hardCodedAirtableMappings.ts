import { AirtableMapping, byNameFieldMapping } from './mappings.js';

const mikesCarWashCustomerMapping: AirtableMapping = {
	_type: 'airtable.mapping',
	airtableBaseId: 'appn1dysBKgmD9nhI',
	airtableTableName: 'Customers',
	tenantId: 'tenant1',
	environmentId: 'dev',
	entityType: 'customers',
	fieldMappings: [byNameFieldMapping('First name', 'first_name'), byNameFieldMapping('Last name', 'last_name'), byNameFieldMapping('Email', 'email')]
};

export const airtableMappings: AirtableMapping[] = [mikesCarWashCustomerMapping];

/**
 * I might have an upsert to a customer and it goes straight into the customers table
 * I might have an upsert of a customer form (own entity, own id), and part of it might go to a customer (via a foreign-key) and part of it might go elsewhere
 * The upsert data structure can be of any form
 *
 * I might have a create of a customer and it goes straight into the customers table
 *
 *
 */
