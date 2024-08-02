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
import {byLocation} from "../../availability/byLocation.js";
import {
    availabilityConfiguration,
    EarliestAvailability,
    findEarliestAvailability,
    serviceFns
} from "@breezbook/packages-core";
import {EarliestResourceAvailability} from "@breezbook/backend-api-types";

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
        .withThreeRequestParams(tenantEnvironmentLocationParam(), resourceTypeParam(), serviceAvailabilityRequestParam(), listResourceAvailabilityByType);
}


function toEarliestResourceAvailability(earliest: EarliestAvailability): EarliestResourceAvailability {
    return {
        resourceId: earliest.resource.id.value,
        earliestDate: earliest.earliestDate?.value ?? null,
        earliestTime: earliest.earliestTime?.value ?? null,
        cheapestPrice: earliest.cheapestPrice?.amount?.value ?? null,
        checkedPeriod: {
            startDate: earliest.period.start.value,
            endDate: earliest.period.end.value
        }
    }
}

export async function listResourceAvailabilityByType(deps: EndpointDependencies, tenantEnvLoc: TenantEnvironmentLocation, resourceType: ResourceType, request: ServiceAvailabilityRequest): Promise<EndpointOutcome[]> {
    const everythingForAvailability = await byLocation.getEverythingForAvailability(deps.prisma, tenantEnvLoc, request.fromDate, request.toDate)
    const config = availabilityConfiguration(
        everythingForAvailability.businessConfiguration.availability,
        everythingForAvailability.businessConfiguration.resourceAvailability,
        everythingForAvailability.businessConfiguration.timeslots,
        everythingForAvailability.businessConfiguration.startTimeSpec);
    const service = serviceFns.findService(everythingForAvailability.businessConfiguration.services, request.serviceId);

    const earliest = findEarliestAvailability(
        config,
        service,
        everythingForAvailability.bookings,
        resourceType,
        request.fromDate,
        request.toDate,
        everythingForAvailability.pricingRules).map((earliest) => toEarliestResourceAvailability(earliest));

    return [httpResponseOutcome(responseOf(200, JSON.stringify(earliest), ['Content-Type', 'application/json']))];
}
