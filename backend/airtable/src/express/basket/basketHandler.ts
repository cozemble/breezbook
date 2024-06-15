import express from 'express';
import {UnpricedBasket, unpricedBasketFns} from '@breezbook/backend-api-types';
import {byLocation} from "../../availability/byLocation.js";
import {TenantEnvironment, tenantEnvironmentLocation} from "@breezbook/packages-core";
import {
    asHandler,
    bodyAsJsonParam,
    EndpointDependencies,
    expressBridge,
    ParamExtractor,
    productionDeps,
    tenantEnvironmentParam
} from "../../infra/endpoint.js";
import {RequestContext} from "../../infra/http/expressHttp4t.js";
import {HttpResponse} from "@http4t/core/contract.js";
import {responseOf} from "@http4t/core/responses.js";
import {priceBasket} from "../../core/basket/priceBasket.js";

function unpricedBasketBody(): ParamExtractor<UnpricedBasket> {
    return bodyAsJsonParam<UnpricedBasket>('unpriced.basket');
}

export async function onBasketPriceRequestExpress(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, basketPriceRequestEndpoint, req, res)
}

export function basketPriceRequestEndpoint(deps: EndpointDependencies, request: RequestContext): Promise<HttpResponse> {
    return asHandler(deps, request).withTwoRequestParams(tenantEnvironmentParam(), unpricedBasketBody(), handlePriceBasket)
}

async function handlePriceBasket(deps: EndpointDependencies, tenantEnvironment: TenantEnvironment, unpricedBasket: UnpricedBasket): Promise<HttpResponse> {
    const {fromDate, toDate} = unpricedBasketFns.getDates(unpricedBasket);
    const locations = unpricedBasket.lines.map((line) => line.locationId);
    const allTheSameLocation = locations.every((val, i, arr) => val.value === arr[0].value);
    if (!allTheSameLocation) {
        return responseOf(400, JSON.stringify({error: 'All line items must be for the same location'}));
    }
    const location = tenantEnvironmentLocation(tenantEnvironment.environmentId, tenantEnvironment.tenantId, locations[0]);
    const everythingForTenant = await byLocation.getEverythingForAvailability(deps.prisma, location, fromDate, toDate);
    const response = priceBasket(everythingForTenant, unpricedBasket);
    const statusCode = response._type === 'error.response' ? 400 : 200;
    return responseOf(statusCode, JSON.stringify(response));
}
