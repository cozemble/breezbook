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

	if (schema.type === 'number' || schema.type === 'integer') return schema.default || 0;

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

// TODO add the unit to the price
/** Format a price that consists of an integer and a decimal
 * @example
 * formatPrice(1000) // 10.00
 */
export const formatPrice = (price: number) => {
	const priceStr = price.toString();

	const priceInteger = priceStr.substring(0, priceStr.length - 2);
	const priceDecimal = priceStr.substring(priceStr.length - 2);

	const formattedPrice = `${priceInteger}.${priceDecimal}`;
	return formattedPrice;
};

/** Convert a JSON schema type to an HTML input type */
export const jsonSchemaTypeToInputType = (type: JSONSchema['type']) => {
	if (type === 'string') return 'text';
	if (type === 'number' || type === 'integer') return 'number';
	if (type === 'boolean') return 'checkbox';

	if (type === 'array') throw new Error('array type not supported');
	if (type === 'object') throw new Error('object type not supported');
};

export const createUID = (length = 8) =>
	(Math.random() * Date.now()).toString(36).substring(2, 2 + length);
