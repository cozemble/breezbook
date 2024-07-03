import {JsonSchemaForm} from "@breezbook/packages-types";

export const carwashForm: JsonSchemaForm = {
	_type: 'json.schema.form',
	id: { _type: 'form.id', value: 'car-details-form' },
	name: 'Car Details Form',
	schema: {
		$schema: 'http://json-schema.org/draft-07/schema#',
		type: 'object',
		properties: {
			make: {
				type: 'string',
				description: 'The manufacturer of the car.'
			},
			model: {
				type: 'string',
				description: 'The model of the car.'
			},
			colour: {
				type: 'string',
				description: 'The colour of the car.'
			},
			year: {
				type: 'integer',
				description: 'The year of the car.'
			},
			firstLineOfAddress: {
				type: 'string',
				description: 'The first line of the address the car will be at'
			},
			postcode: {
				type: 'string',
				description: 'The postcode the car will be at'
			}
		},
		required: ['make', 'model', 'colour', 'year','firstLineOfAddress','postcode'],
		additionalProperties: false
	}
};
export const customerForm: JsonSchemaForm = {
	_type: 'json.schema.form',
	id: {
		_type: 'form.id',
		value: 'contact-details-form'
	},
	name: 'Customer Details Form',
	schema: {
		$schema: 'http://json-schema.org/draft-07/schema#',
		type: 'object',
		properties: {
			age: {
				type: 'number',
				description: 'Your age, and of course it does not matter, this is only for tests.'
			},
		},
		required: ['age'],
		additionalProperties: false
	}
};
