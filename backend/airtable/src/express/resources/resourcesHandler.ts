import express from "express";
import {languages, resourceType, ResourceType, TenantEnvironmentLocation} from "@breezbook/packages-types";
import {resources} from "../../core/resources/resources.js";
import {
    asHandler,
    EndpointDependencies,
    EndpointOutcome,
    expressBridge,
    httpResponseOutcome,
    paramExtractor,
    ParamExtractor,
    path,
    productionDeps,
    RequestValueExtractor,
    tenantEnvironmentLocationParam
} from "../../infra/endpoint.js";
import {RequestContext} from "../../infra/http/expressHttp4t.js";
import { responseOf } from "@breezbook/packages-http/dist/responses.js";

export function resourceTypeParam(requestValue: RequestValueExtractor = path('type')): ParamExtractor<ResourceType> {
    return paramExtractor('type', requestValue.extractor, resourceType);
}

export async function onListResourcesByTypeRequestExpress(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, listResourcesByTypeRequestEndpoint, req, res)
}

export async function listResourcesByTypeRequestEndpoint(deps: EndpointDependencies, request: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, request).withTwoRequestParams(tenantEnvironmentLocationParam(), resourceTypeParam(), listResourcesByType);
}

async function listResourcesByType(deps: EndpointDependencies, tenantEnvironmentLocation: TenantEnvironmentLocation, resourceType: ResourceType): Promise<EndpointOutcome[]> {
    const outcome = await resources.listByType(deps.prisma, tenantEnvironmentLocation, resourceType, languages.en);
    return [httpResponseOutcome(responseOf(Array.isArray(outcome) ? 200 : 400, JSON.stringify(outcome),['Content-Type', 'application/json']))];
}
