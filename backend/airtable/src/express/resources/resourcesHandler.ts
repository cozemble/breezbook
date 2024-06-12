import express from "express";
import {resourceType, ResourceType, TenantEnvironmentLocation} from "@breezbook/packages-core";
import {resources} from "../../core/resources/resources.js";
import {
    asHandler,
    EndpointDependencies,
    paramExtractor,
    ParamExtractor,
    path,
    productionDeps,
    RequestValueExtractor,
    tenantEnvironmentLocationParam
} from "../../infra/endpoint.js";
import {responseOf} from "@http4t/core/responses.js";
import {HttpResponse} from "@http4t/core/contract.js";

export function resourceTypeParam(requestValue: RequestValueExtractor = path('type')): ParamExtractor<ResourceType> {
    return paramExtractor('type', requestValue.extractor, resourceType);
}

export async function onListResourcesByTypeRequest(req: express.Request, res: express.Response): Promise<void> {
    await asHandler(productionDeps, req, res).withTwoRequestParams(tenantEnvironmentLocationParam(), resourceTypeParam(), listResourcesByType);
}

export async function listResourcesByType(deps: EndpointDependencies, tenantEnvironmentLocation: TenantEnvironmentLocation, resourceType: ResourceType): Promise<HttpResponse> {
    const outcome = await resources.listByType(deps.prisma, tenantEnvironmentLocation, resourceType);
    return responseOf(Array.isArray(outcome) ? 200 : 400, JSON.stringify(outcome));
}
