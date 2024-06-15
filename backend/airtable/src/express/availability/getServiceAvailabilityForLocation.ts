import express from "express";
import {
    asHandler,
    date,
    EndpointDependencies,
    EndpointOutcome,
    expressBridge,
    httpResponseOutcome,
    ParamExtractor,
    productionDeps,
    query,
    serviceIdParam,
    tenantEnvironmentLocationParam
} from "../../infra/endpoint.js";
import {responseOf} from "@http4t/core/responses.js";
import {byLocation} from "../../availability/byLocation.js";
import {getAvailabilityForService2} from "../../core/getAvailabilityForService.js";
import {
    failure,
    Failure,
    IsoDate,
    mandatory,
    resourceFns,
    resourceId,
    ResourceId,
    resourceRequirementId,
    ResourceRequirementId,
    ServiceId,
    specificResource,
    success,
    TenantEnvironmentLocation
} from "@breezbook/packages-core";
import {RequestContext} from "../../infra/http/expressHttp4t.js";
import {HttpResponse} from "@http4t/core/contract.js";
import {EverythingForAvailability} from "../getEverythingForAvailability.js";

interface RequirementOverride {
    requirementId: ResourceRequirementId;
    resourceId: ResourceId;
}

export interface ServiceAvailabilityRequest {
    serviceId: ServiceId;
    fromDate: IsoDate;
    toDate: IsoDate;
    requirementOverrides: RequirementOverride[]
}

export function requirementOverridesParam(): ParamExtractor<RequirementOverride[]> {
    return (req: RequestContext) => {
        const bodyJson = req.request.body as any ?? {}
        const requirementOverrides = bodyJson.requirementOverrides;
        if (!requirementOverrides) {
            return success([]);
        }
        try {
            if (!Array.isArray(requirementOverrides)) {
                return failure(responseOf(400, `requirementOverrides must be an array`));
            }
            return success(requirementOverrides.map((r: any) => ({
                requirementId: resourceRequirementId(mandatory(r.requirementId, 'requirementId')),
                resourceId: resourceId(mandatory(r.resourceId, 'resourceId'))
            })));
        } catch (e) {
            return failure(responseOf(400, `requirementOverrides must be a JSON array`));
        }
    };
}

export function serviceAvailabilityRequestParam(): ParamExtractor<ServiceAvailabilityRequest> {
    return (req: RequestContext) => {
        const params = [serviceIdParam()(req), date(query('fromDate'))(req), date(query('toDate'))(req), requirementOverridesParam()(req)];
        const firstFailure = params.find(p => p._type === 'failure');
        if (firstFailure) {
            return firstFailure as Failure<HttpResponse>;
        }
        return success({
            serviceId: params[0].value,
            fromDate: params[1].value,
            toDate: params[2].value,
            requirementOverrides: params[3].value
        } as ServiceAvailabilityRequest);
    };
}

export async function onGetServiceAvailabilityForLocationExpress(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, getServiceAvailabilityForLocationEndpoint, req, res)
}

export async function getServiceAvailabilityForLocationEndpoint(deps: EndpointDependencies, req: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, req).withTwoRequestParams(tenantEnvironmentLocationParam(), serviceAvailabilityRequestParam(), getServiceAvailabilityForLocation)
}

function foldInRequestOverrides(e: EverythingForAvailability, request: ServiceAvailabilityRequest): EverythingForAvailability {
    const theService = mandatory(e.businessConfiguration.services.find(s => s.id.value === request.serviceId.value), `Service ${request.serviceId.value} not found in ${JSON.stringify(e.businessConfiguration.services)}`)
    const mutatedService = {
        ...theService, resourceRequirements: theService.resourceRequirements.map(req => {
            const maybeOverride = request.requirementOverrides.find(o => o.requirementId.value === req.id.value)
            if (maybeOverride) {
                return specificResource(resourceFns.findById(e.businessConfiguration.resources, maybeOverride.resourceId), maybeOverride.requirementId)
            }
            return req;
        })
    }
    return {
        ...e,
        businessConfiguration: {
            ...e.businessConfiguration,
            services: e.businessConfiguration.services.map(s => s.id.value === request.serviceId.value ? mutatedService : s)
        }
    }
}

async function getServiceAvailabilityForLocation(deps: EndpointDependencies, tenantEnvLoc: TenantEnvironmentLocation, request: ServiceAvailabilityRequest): Promise<EndpointOutcome[]> {
    console.log(
        `Getting availability for location ${tenantEnvLoc.locationId.value}, tenant ${tenantEnvLoc.tenantId.value} and service ${request.serviceId.value} from ${request.fromDate.value} to ${request.toDate.value} in environment ${tenantEnvLoc.environmentId.value}`
    );
    const everythingForTenant = await byLocation.getEverythingForAvailability(deps.prisma, tenantEnvLoc, request.fromDate, request.toDate).then(e => foldInRequestOverrides(e, request));
    return [httpResponseOutcome(responseOf(200, JSON.stringify(getAvailabilityForService2(everythingForTenant, request.serviceId, request.fromDate, request.toDate))))];
}
