import { bodyAsJsonParam, ParamExtractor, tenantEnvironmentParam, withTwoRequestParams } from '../../infra/functionalExpress.js';
import express from 'express';
import { pricedBasket, PricedBasket, UnpricedBasket, unpricedBasketFns } from '../../core/basket/pricing.js';
import { EverythingForTenant, getEverythingForTenant } from '../getEverythingForTenant.js';
import { ErrorResponse } from '@breezbook/backend-api-types';
import { currencies, price } from '@breezbook/packages-core';

function unpricedBasketBody(): ParamExtractor<UnpricedBasket | null> {
	return bodyAsJsonParam<UnpricedBasket>('unpriced.basket');
}

export function priceBasket(everythingForTenant: EverythingForTenant, unpricedBasket: UnpricedBasket): PricedBasket | ErrorResponse {
	return pricedBasket([], price(0, currencies.GBP), unpricedBasket.couponCode);
}

export async function onBasketPriceRequest(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, tenantEnvironmentParam(), unpricedBasketBody(), async (tenantEnvironment, unpricedBasket) => {
		const { fromDate, toDate } = unpricedBasketFns.getDates(unpricedBasket);
		const everythingForTenant = await getEverythingForTenant(tenantEnvironment, fromDate, toDate);
		const response = priceBasket(everythingForTenant, unpricedBasket);
		const statusCode = response._type === 'error.response' ? 400 : 200;
		res.status(statusCode).send(response);
	});
}
