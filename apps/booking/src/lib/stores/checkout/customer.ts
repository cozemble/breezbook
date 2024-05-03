import { get, writable } from 'svelte/store';
import Ajv from 'ajv';
import type { ErrorObject as AjvErrorObject } from 'ajv';
import _ from 'lodash';

import * as core from '@breezbook/packages-core';

import { ajvUtils, jsonSchemaUtils } from '$lib/common/utils';
import notifications, { type Notification } from '../notifications';

export function createCustomerStore() {
	const schema = writable<JSONSchema>({
		type: 'object',
		properties: {
			firstName: { type: 'string', description: 'Your name', title: 'First Name' },
			lastName: { type: 'string', description: 'Your last name', title: 'Last Name' },
			email: { type: 'string', description: 'Your email address', title: 'Email' },
			formData: {
				type: 'object',
				properties: {
					phone: { type: 'string', description: 'Your phone number', title: 'Phone' },
				},
				required: ['phone']
			}
		},
		required: ['firstName', 'lastName', 'email', 'formData']
	});
	const loading = writable(false);
	const errors = writable<ObjectError>({});

	const customer = writable<core.Customer>(
		core.customer('', '', '', {
			phone: '',
			firstLineOfAddress: '',
			postcode: ''
		})
	);

	let errorNotifications: Notification[] = [];

	/** Add errors to the store */
	const addErrors = (errorObjects?: AjvErrorObject[] | null) => {
		errors.update((prev) => {
			if (!errorObjects) return {};

			// remove previous error notifications
			errorNotifications.forEach((notif) => notif.remove());

			// add new error notifications
			errorNotifications = errorObjects.map((error) => {
				const notif = notifications.create({
					title: 'Error',
					description: error.message,
					type: 'error'
				});
				return notif;
			});

			// convert error to error objects and merge them
			return _.merge({}, ...errorObjects.map(ajvUtils.convertToErrorObject));
		});
	};

	/** Validate the current value against the schema and add errors to the store */
	const validate = () => {
		errors.set({});

		const ajv = new Ajv({
			allErrors: true
		});
		ajv.addVocabulary([]); // TODO add specific words later if needed

		const validate = ajv.compile(get(schema));
		// @ts-expect-error: the customer type is not working with AnyValue
		const isValid = validate(jsonSchemaUtils.removeEmptyValues(get(customer))); // TODO fix AnyValue type issue

		addErrors(validate.errors);

		return isValid;
	};

	//

	//

	let unsubValidate: () => void; // prevent memory leak

	/** Submit the form and call the callback if valid */
	const submitWithCallback = async (callbackIfValid: () => void) => {
		console.log('submitting');
		unsubValidate?.(); // unsubscribe from validation
		const isValid = validate();

		if (!isValid) {
			console.log('not valid');
			unsubValidate = customer.subscribe(() => validate()); // validate on change so the user knows what to fix
			return;
		}

		console.log('valid');
		callbackIfValid();
	};

	return {
		customer,

		schema,
		loading,
		errors,

		submitWithCallback
	};
}
