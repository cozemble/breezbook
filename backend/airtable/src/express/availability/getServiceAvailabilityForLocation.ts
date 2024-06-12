import express from "express";
import {
    asHandler,
    date,
    EndpointDependencies,
    ParamExtractor,
    productionDeps,
    query,
    serviceIdParam,
    tenantEnvironmentLocationParam
} from "../../infra/endpoint.js";
import {responseOf} from "@http4t/core/responses.js";
import {byLocation} from "../../availability/byLocation.js";
import {multiLocationGym} from "../../dx/loadMultiLocationGymTenant.js";
import {getAvailabilityForService, getAvailabilityForService2} from "../../core/getAvailabilityForService.js";
import {
    Failure,
    IsoDate,
    ResourceId,
    ResourceRequirementId,
    ServiceId,
    success,
    TenantEnvironmentLocation
} from "@breezbook/packages-core";
import {RequestContext} from "../../infra/http/expressHttp4t.js";
import {HttpResponse} from "@http4t/core/contract.js";

interface RequirementOverride {
    requirementId: ResourceRequirementId;
    resourceId: ResourceId;
}

interface ServiceAvailabilityRequest {
    serviceId: ServiceId;
    fromDate: IsoDate;
    toDate: IsoDate;
    requirementOverrides: RequirementOverride[]
}

export function serviceAvailabilityRequestParam(): ParamExtractor<ServiceAvailabilityRequest> {
    return (req: RequestContext) => {
        const params = [serviceIdParam()(req), date(query('fromDate'))(req), date(query('toDate'))(req)];
        const firstFailure = params.find(p => p._type === 'failure');
        if (firstFailure) {
            return firstFailure as Failure<HttpResponse>;
        }
        return success({
            serviceId: params[0].value,
            fromDate: params[1].value,
            toDate: params[2].value,
            requirementOverrides: []
        } as ServiceAvailabilityRequest);
    };
}


export async function onGetServiceAvailabilityForLocation(req: express.Request, res: express.Response): Promise<void> {
    await asHandler(productionDeps, req, res)
        .withTwoRequestParams(tenantEnvironmentLocationParam(), serviceAvailabilityRequestParam(), getServiceAvailabilityForLocation);
}

export async function getServiceAvailabilityForLocation(deps: EndpointDependencies, tenantEnvLoc: TenantEnvironmentLocation, request: ServiceAvailabilityRequest) {
    console.log(
        `Getting availability for location ${tenantEnvLoc.locationId.value}, tenant ${tenantEnvLoc.tenantId.value} and service ${request.serviceId.value} from ${request.fromDate.value} to ${request.toDate.value} in environment ${tenantEnvLoc.environmentId.value}`
    );
    const everythingForTenant = await byLocation.getEverythingForAvailability(deps.prisma, tenantEnvLoc, request.fromDate, request.toDate);
    if (tenantEnvLoc.tenantId.value === multiLocationGym.tenant_id) {
        return responseOf(200, JSON.stringify(getAvailabilityForService2(everythingForTenant, request.serviceId, request.fromDate, request.toDate)));
    } else {
        return responseOf(200, JSON.stringify(getAvailabilityForService(everythingForTenant, request.serviceId, request.fromDate, request.toDate)));
    }
}
