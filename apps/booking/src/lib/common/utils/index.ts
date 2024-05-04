export * as ajvUtils from './ajv';
export * as jsonSchemaUtils from './jsonSchema';

// TODO add the unit to the price
/** Format a price that consists of an integer and a decimal
 * @example
 * formatPrice(1000) // 10
 * formatPrice(1050) // 10.50
 * formatPrice(0) // 0
 */
export const formatPrice = (price: number) => {
	if (price === 0) return '0';
	const priceStr = price.toString();

	const priceInteger = priceStr.substring(0, priceStr.length - 2);
	const priceDecimal = priceStr.substring(priceStr.length - 2);

	const isPriceDecimalEmpty = priceDecimal === '00';

	const formattedPrice = isPriceDecimalEmpty ? priceInteger : `${priceInteger}.${priceDecimal}`;
	return formattedPrice;
};

export const createUID = (length = 8) =>
	(Math.random() * Date.now()).toString(36).substring(2, 2 + length);

export const link = {
	getSubdomain: (url: URL) => {
		const isThereASubdomain = url.host.split('.').length > 1;
		if (!isThereASubdomain) return;

		const subdomain = url.host.split('.')[0];
		return subdomain;
	},

	removeSubdomain: (url: URL) => {
		const hasSubdomain = !!link.getSubdomain(url);
		if (!hasSubdomain) return url.host;

		const domain = url.host.split('.').slice(1).join('.');
		return url.protocol + '//' + domain;
	}
};
