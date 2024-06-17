import express from 'express';
import {UnpricedBasket, unpricedBasketFns} from '@breezbook/backend-api-types';
import {byLocation} from "../../availability/byLocation.js";
import {TenantEnvironment, mandatory, tenantEnvironmentLocation} from "@breezbook/packages-core";
import {
    asHandler,
    bodyAsJsonParam,
    EndpointDependencies,
    EndpointOutcome,
    expressBridge,
    httpResponseOutcome,
    ParamExtractor,
    productionDeps,
    tenantEnvironmentParam
} from "../../infra/endpoint.js";
import {priceBasket} from "../../core/basket/priceBasket.js";
import { RequestContext } from '../../infra/http/expressHttp4t.js';
import { responseOf } from '@breezbook/packages-http/dist/responses.js';

function unpricedBasketBody(): ParamExtractor<UnpricedBasket> {
    return bodyAsJsonParam<UnpricedBasket>('unpriced.basket');
}

export async function onBasketPriceRequestExpress(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, basketPriceRequestEndpoint, req, res)
}

export function basketPriceRequestEndpoint(deps: EndpointDependencies, request: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, request).withTwoRequestParams(tenantEnvironmentParam(), unpricedBasketBody(), handlePriceBasket)
}

async function handlePriceBasket(deps: EndpointDependencies, tenantEnvironment: TenantEnvironment, unpricedBasket: UnpricedBasket): Promise<EndpointOutcome[]> {
    const {fromDate, toDate} = unpricedBasketFns.getDates(unpricedBasket);
    const locations = unpricedBasket.lines.map((line) => line.locationId);
    const allTheSameLocation = locations.every((val, i, arr) => val.value === arr[0]?.value);
    if (!allTheSameLocation) {
        return [httpResponseOutcome(responseOf(400, JSON.stringify({error: 'All line items must be for the same location'})))];
    }
    const location = tenantEnvironmentLocation(tenantEnvironment.environmentId, tenantEnvironment.tenantId, mandatory(locations[0],`Missing first location`));
    const everythingForTenant = await byLocation.getEverythingForAvailability(deps.prisma, location, fromDate, toDate);
    const response = priceBasket(everythingForTenant, unpricedBasket);
    const statusCode = response._type === 'error.response' ? 400 : 200;
    return [httpResponseOutcome(responseOf(statusCode, JSON.stringify(response)))];
}
