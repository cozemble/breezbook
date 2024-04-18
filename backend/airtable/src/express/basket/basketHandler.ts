import {
    bodyAsJsonParam,
    ParamExtractor,
    tenantEnvironmentParam,
    withTwoRequestParams
} from '../../infra/functionalExpress.js';
import express from 'express';
import {UnpricedBasket, unpricedBasketFns} from '@breezbook/backend-api-types';
import {getEverythingForAvailability} from '../getEverythingForAvailability.js';
import {priceBasket} from '../../core/basket/priceBasket.js';
import {prismaClient} from "../../prisma/client.js";

function unpricedBasketBody(): ParamExtractor<UnpricedBasket | null> {
    return bodyAsJsonParam<UnpricedBasket>('unpriced.basket');
}

export async function onBasketPriceRequest(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, tenantEnvironmentParam(), unpricedBasketBody(), async (tenantEnvironment, unpricedBasket) => {
        const {fromDate, toDate} = unpricedBasketFns.getDates(unpricedBasket);
        const everythingForTenant = await getEverythingForAvailability(prismaClient(), tenantEnvironment, fromDate, toDate);
        const response = priceBasket(everythingForTenant, unpricedBasket);
        const statusCode = response._type === 'error.response' ? 400 : 200;
        res.status(statusCode).send(response);
    });
}
