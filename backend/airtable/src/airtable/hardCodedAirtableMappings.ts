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
