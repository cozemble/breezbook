import { JsonSchemaForm } from '../types.js';

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
			}
		},
		required: ['make', 'model', 'colour', 'year'],
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
			phone: {
				type: 'string',
				description: 'Your phone number.'
			},
			firstLineOfAddress: {
				type: 'string',
				description: 'The first line of your address.'
			},
			postcode: {
				type: 'string',
				description: 'Your postcode.'
			}
		},
		required: ['phone', 'firstLineOfAddress', 'postcode'],
		additionalProperties: false
	}
};
