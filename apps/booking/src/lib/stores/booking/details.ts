import type { ErrorObject as AjvErrorObject } from 'ajv';
import { writable, get } from 'svelte/store';
import Ajv from 'ajv';
import _ from 'lodash';

import api from '$lib/common/api';
import { initValues, removeEmptyValues } from '$lib/utils';
import * as ajvUtils from '$lib/utils/ajv';

/** Setup stores to manage details */
export default function createDetailsStore(service: Service) {
	const schema = writable<JSONSchema>({});
	const value = writable<Service.Details>({}); // TODO proper typing
	const loading = writable(false);
	const errors = writable<ObjectError>({});

	const initValue = (schema: JSONSchema) => {
		const newVal = initValues(schema) as Service.Details;
		value.set(newVal);
	};

	const fetchSchema = async () => {
		loading.set(true);

		const res = await api.service.getDetails('', service.slug); // TODO proper params
		const sche = res.serviceSummary.forms[0].schema as JSONSchema;
		schema.set(sche);

		initValue(sche); // init value with default values

		loading.set(false);
	};

	// fetch time slots initially
	fetchSchema();

	/** Add errors to the store */
	const addErrors = (errorObjects?: AjvErrorObject[] | null) => {
		errors.update((prev) => {
			if (!errorObjects) return {};

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
		const isValid = validate(removeEmptyValues(get(value)));

		addErrors(validate.errors);

		return isValid;
	};

	let unsubValidate: () => void; // prevent memory leak

	/** Submit the form and call the callback if valid */
	const submitWithCallback = async (callbackIfValid: () => void) => {
		unsubValidate?.(); // unsubscribe from validation
		const isValid = validate();

		if (!isValid) {
			unsubValidate = value.subscribe(() => validate()); // validate on change so the user knows what to fix
			return;
		}

		callbackIfValid();
	};

	return {
		schema,
		value,
		loading,
		errors,
		submitWithCallback
	};
}
