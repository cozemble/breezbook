/* copied from cozemble/monorepo/data-editor */

import type { ErrorObject as AjvErrorObject } from 'ajv';

/** Create error message from Ajv error */
export const createErrorMessage = (
	error: AjvErrorObject
): Record<string, string | string[]> | string => {
	const { keyword, params } = error;

	switch (keyword) {
		case 'required':
			return { [params.missingProperty]: 'Required' };

		case 'minItems':
			return { self: `Minimum ${params.limit} items` };

		case 'maxItems':
			return { self: `Maximum ${params.limit} items` };

		case 'uniqueItems':
			return { self: 'Must be unique', items: Array(params.j).fill({ self: 'Must be unique' }) };

		default:
			return 'Invalid';
	}
};

/** Convert Ajv error to error object
 *
 * Example:
 * input: "/customers/0/addresses/0"
 * output: {
 *   customers: [
 *    {}, // as many {} as the number in the path to preserve index
 *     {
 *       addresses: [
 *         {}
 *       ]
 *     }
 *   ]
 * }
 */
export const convertToErrorObject = (error: AjvErrorObject): Record<string, any> =>
	error.instancePath.split('/').reduceRight(
		(prev, curr) => {
			if (curr === '') return prev;

			// check if curr can be converted to a number
			if (Number.isInteger(Number(curr))) {
				const index = Number(curr);
				return {
					items: Array(index + 1)
						.fill(undefined)
						.map((_, i) => {
							if (i === index) {
								return prev;
							}
							return {};
						})
				};
			}

			return { [curr]: prev };
		},
		createErrorMessage(error) as Record<string, any>
	);
