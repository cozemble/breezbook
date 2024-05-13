import {
    bodyAsJsonParam,
    ParamExtractor,
    tenantEnvironmentParam,
    withTwoRequestParams
} from '../../infra/functionalExpress.js';
import express from 'express';
import {UnpricedBasket, unpricedBasketFns} from '@breezbook/backend-api-types';
import {priceBasket} from '../../core/basket/priceBasket.js';
import {prismaClient} from "../../prisma/client.js";
import {byLocation} from "../../availability/byLocation.js";
import {tenantEnvironmentLocation} from "@breezbook/packages-core";

function unpricedBasketBody(): ParamExtractor<UnpricedBasket | null> {
    return bodyAsJsonParam<UnpricedBasket>('unpriced.basket');
}

export async function onBasketPriceRequest(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, tenantEnvironmentParam(), unpricedBasketBody(), async (tenantEnvironment, unpricedBasket) => {
        const {fromDate, toDate} = unpricedBasketFns.getDates(unpricedBasket);
        const locations = unpricedBasket.lines.map((line) => line.locationId);
        const allTheSameLocation = locations.every((val, i, arr) => val.value === arr[0].value);
        if (!allTheSameLocation) {
            res.status(400).send({error: 'All line items must be for the same location'});
            return;
        }
        const location = tenantEnvironmentLocation(tenantEnvironment.environmentId, tenantEnvironment.tenantId, locations[0]);
        const everythingForTenant = await byLocation.getEverythingForAvailability(prismaClient(), location, fromDate, toDate);
        const response = priceBasket(everythingForTenant, unpricedBasket);
        const statusCode = response._type === 'error.response' ? 400 : 200;
        res.status(statusCode).send(response);
    });
}
