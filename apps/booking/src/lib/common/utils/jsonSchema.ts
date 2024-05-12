/* copied from cozemble/monorepo/data-editor */

import _ from 'lodash';

/** Initialize an object with empty values based on the schema */
export const initValues = (schema: JSONSchema): AnyValue => {
	if (schema.type === 'array') return schema.default || [];

	if (schema.type === 'object') {
		return Object.entries(schema.properties || {}).reduce((prev, [key, value]) => {
			prev[key] = initValues(value);

			return prev;
		}, {} as ObjectValue);
	}

	if (schema.type === 'string') return schema.default || '';

	if (schema.type === 'number' || schema.type === 'integer') return schema.default || undefined;

	if (schema.type === 'boolean') return schema.default || false;

	return schema.default || null;
};

/** Remove empty values from an object */
export const removeEmptyValues = (value: AnyValue): AnyValue => {
	// array
	if (_.isArray(value) && value.length > 0) return value.map((v) => removeEmptyValues(v));

	// object
	if (_.isObject(value))
		return Object.entries(value).reduce((prev, [key, value]) => {
			prev[key] = removeEmptyValues(value);

			return prev;
		}, {} as ObjectValue);

	// simple value
	const emptyValues = ['', null, undefined, NaN];
	if (!_.includes(emptyValues, value)) return value;
};

/** Convert a JSON schema type to an HTML input type */
export const jsonSchemaTypeToInputType = (type: JSONSchema['type']) => {
	if (type === 'string') return 'text';
	if (type === 'number' || type === 'integer') return 'number';
	if (type === 'boolean') return 'checkbox';

	if (type === 'array') throw new Error('array type not supported');
	if (type === 'object') throw new Error('object type not supported');
};
