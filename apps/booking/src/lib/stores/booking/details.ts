import { writable } from 'svelte/store';
import api from '$lib/common/api';
import { initValues } from '$lib/utils';

/** Setup stores to manage details */
export function createDetailsStore(service: Service) {
	const schema = writable<JSONSchema>({});
	const value = writable<Service.Details>({}); // TODO proper typing
	const loading = writable(false);
	const errors = writable<ObjectError>({
		make: 'Oops! Your car make is so weird we cannot wash it'
	});
	// TODO validation

	const initValue = (schema: JSONSchema) => {
		const newVal = initValues(schema) as Service.Details;
		console.log('newVal', newVal);
		value.set(newVal);
	};

	const fetchSchema = async () => {
		loading.set(true);

		const res = await api.service.getDetails('', ''); // TODO proper params
		const sche = res.serviceSummary.forms[0].schema as JSONSchema;
		schema.set(sche);

		initValue(sche); // init value with default values

		loading.set(false);
	};

	// fetch time slots initially
	fetchSchema();

	return {
		schema,
		value,
		loading,
		errors
	};
}
