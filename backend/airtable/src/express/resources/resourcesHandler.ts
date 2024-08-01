import express from "express";
import {LanguageId, resourceType, ResourceType, TenantEnvironmentLocation} from "@breezbook/packages-types";
import {resources} from "../../core/resources/resources.js";
import {
    asHandler,
    EndpointDependencies,
    EndpointOutcome,
    expressBridge,
    httpResponseOutcome,
    languageIdParam,
    paramExtractor,
    ParamExtractor,
    path,
    productionDeps,
    RequestValueExtractor,
    tenantEnvironmentLocationParam
} from "../../infra/endpoint.js";
import {RequestContext} from "../../infra/http/expressHttp4t.js";
import {responseOf} from "@breezbook/packages-http/dist/responses.js";
import {
    ServiceAvailabilityRequest,
    serviceAvailabilityRequestParam
} from "../availability/getServiceAvailabilityForLocation.js";

export function resourceTypeParam(requestValue: RequestValueExtractor = path('type')): ParamExtractor<ResourceType> {
    return paramExtractor('type', requestValue.extractor, resourceType);
}

export async function onListResourcesByTypeRequestExpress(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, listResourcesByTypeRequestEndpoint, req, res)
}

export async function listResourcesByTypeRequestEndpoint(deps: EndpointDependencies, request: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, request).withThreeRequestParams(tenantEnvironmentLocationParam(), resourceTypeParam(), languageIdParam(), listResourcesByType);
}

async function listResourcesByType(deps: EndpointDependencies, tenantEnvironmentLocation: TenantEnvironmentLocation, resourceType: ResourceType, languageId: LanguageId): Promise<EndpointOutcome[]> {
    const outcome = await resources.listByType(deps.prisma, tenantEnvironmentLocation, resourceType, languageId);
    return [httpResponseOutcome(responseOf(Array.isArray(outcome) ? 200 : 400, JSON.stringify(outcome), ['Content-Type', 'application/json']))];
}

export async function onListResourcesAvailabilityByTypeRequestExpress(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, listResourceAvailabilityByTypeRequestEndpoint, req, res)
}

export async function listResourceAvailabilityByTypeRequestEndpoint(deps: EndpointDependencies, request: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, request)
        .withFourRequestParams(tenantEnvironmentLocationParam(), resourceTypeParam(), languageIdParam(), serviceAvailabilityRequestParam(), listResourceAvailabilityByType);
}

export async function listResourceAvailabilityByType(deps: EndpointDependencies, tenantEnvironmentLocation: TenantEnvironmentLocation, resourceType: ResourceType, languageId: LanguageId, serviceAvailability: ServiceAvailabilityRequest): Promise<EndpointOutcome[]> {
    // const outcome = await resources.listAvailabilityByType(deps.prisma, tenantEnvironmentLocation, resourceType, languageId, serviceAvailability);
    return [httpResponseOutcome(responseOf(200, JSON.stringify({}), ['Content-Type', 'application/json']))];
}
