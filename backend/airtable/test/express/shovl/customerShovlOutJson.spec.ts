import { test, expect } from 'vitest';
import { DbCustomer, DbCustomerFormValues, DbForm } from '../../../src/prisma/dbtypes.js';
import { customerShovlOutJson } from '../../../src/express/shovl/shovlEndpoints.js';

const customer: DbCustomer = {
	id: 'customer1',
	tenant_id: 'tenant1',
	environment_id: 'dev',
	email: 'mike@email.com',
	first_name: 'Mike',
	last_name: 'Smith',
	created_at: new Date(),
	updated_at: new Date()
};

const customerForm: DbForm = {
	id: 'contactDetails',
	tenant_id: 'tenant1',
	environment_id: 'dev',
	name: 'Contact Details',
	description: null,
	definition: {},
	created_at: new Date(),
	updated_at: new Date()
};

test('when no customer form data, is absent from json', () => {
	const json = customerShovlOutJson(customer, null);
	expect(json.contactDetails).toBeUndefined();
});

test('puts customer form data in the json', () => {
	const customerFormData: DbCustomerFormValues = {
		tenant_id: 'tenant1',
		environment_id: 'dev',
		customer_id: '',
		form_values: {
			phone: '876876',
			postcode: 'XXX',
			firstLineOfAddress: '11 Main Street'
		}
	};
	const customerWithFormValues: any = {
		...customer,
		customer_form_values: [customerFormData]
	};
	const json = customerShovlOutJson(customerWithFormValues, customerForm);
	console.log({ json });
	expect(json.contactDetails).toEqual(customerFormData.form_values);
});

test('when more than one customer form data, throws an error', () => {
	const customerFormData1: DbCustomerFormValues = {
		tenant_id: 'tenant1',
		environment_id: 'dev',
		customer_id: '',
		form_values: {
			phone: '876876',
			postcode: 'XXX',
			firstLineOfAddress: '11 Main Street'
		}
	};
	const customerFormData2: DbCustomerFormValues = {
		tenant_id: 'tenant1',
		environment_id: 'dev',
		customer_id: '',
		form_values: {
			phone: '876876',
			postcode: 'XXX',
			firstLineOfAddress: '11 Main Street'
		}
	};
	const customerWithFormValues: any = {
		...customer,
		customer_form_values: [customerFormData1, customerFormData2]
	};
	expect(() => customerShovlOutJson(customerWithFormValues, customerForm)).toThrow();
});
