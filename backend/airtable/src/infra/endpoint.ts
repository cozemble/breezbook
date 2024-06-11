import {HttpHandler, HttpResponse} from "@http4t/core/contract.js";
import {PrismaClient} from "@prisma/client";
import express from "express";
import {asExpressResponse, asRequestContext, RequestContext} from "./http/expressHttp4t.js";
import {responseOf} from "@http4t/core/responses.js";
import {query as http4tQuery} from "@http4t/core/queries.js";
import {
    environmentId,
    EnvironmentId,
    failure,
    Failure,
    isoDate,
    IsoDate,
    locationId,
    LocationId,
    serviceId,
    ServiceId,
    success,
    Success,
    tenantEnvironmentLocation,
    TenantEnvironmentLocation,
    tenantId,
    TenantId
} from "@breezbook/packages-core";

export interface EndpointDependencies {
    prisma: PrismaClient
    httpClient: HttpHandler
    eventSender: (event: { name: string, data: any }) => Promise<void>
}

export type EndpointDependenciesFactory = (request: RequestContext) => EndpointDependencies;

export interface Handler {
    withFourRequestParams<A, B, C, D>(aParam: ParamExtractor<A>,
                                      bParam: ParamExtractor<B>,
                                      cParam: ParamExtractor<C>,
                                      dParam: ParamExtractor<D>,
                                      f: (deps: EndpointDependencies, a: A, b: B, c: C, d: D) => Promise<HttpResponse>): Promise<void>
}

export interface RequestValueExtractor {
    name: string;
    extractor: (req: RequestContext) => string | null;
}

export function query(paramName: string): RequestValueExtractor {
    const extractor = (req: RequestContext) => http4tQuery(req.request.uri.query, paramName) ?? null;
    return {name: paramName, extractor};
}

export function path(paramName: string): RequestValueExtractor {
    const extractor = (req: RequestContext) => req.params[paramName] ?? null;
    return {name: paramName, extractor};
}

export type ParamExtractor<T> = (req: RequestContext) => Success<T> | Failure<HttpResponse>

export function date(requestValue: RequestValueExtractor): ParamExtractor<IsoDate> {
    return (req: RequestContext) => {
        const paramValue = requestValue.extractor(req);
        if (!paramValue) {
            return failure(responseOf(400, `Missing required parameter ${requestValue.name}`));
        }
        try {
            return success(isoDate(paramValue));
        } catch (error) {
            return failure(responseOf(400, `Invalid date format ${paramValue}. Expected YYYY-MM-DD`));
        }
    };
}

export function paramExtractor<T>(
    paramName: string,
    extractor: (req: RequestContext) => string | null,
    factoryFn: (s: string) => T
): ParamExtractor<T> {
    return (req: RequestContext) => {
        const paramValue = extractor(req);
        if (!paramValue) {
            return failure(responseOf(400, `Missing required parameter ${paramName}`));
        }
        return success(factoryFn(paramValue));
    };
}


export function serviceIdParam(requestValue: RequestValueExtractor = path('serviceId')): ParamExtractor<ServiceId> {
    return paramExtractor('serviceId', requestValue.extractor, serviceId);
}

export function tenantIdParam(requestValue: RequestValueExtractor = path('tenantId')): ParamExtractor<TenantId> {
    return paramExtractor('tenantId', requestValue.extractor, tenantId);
}

export function environmentIdParam(requestValue: RequestValueExtractor = path('envId')): ParamExtractor<EnvironmentId> {
    return paramExtractor('envId', requestValue.extractor, environmentId);
}

export function locationIdParam(requestValue: RequestValueExtractor = path('locationId')): ParamExtractor<LocationId> {
    return paramExtractor('locationId', requestValue.extractor, locationId);
}

export function tenantEnvironmentLocationParam(
    tenantIdExtractor: RequestValueExtractor = path('tenantId'),
    environmentIdExtractor: RequestValueExtractor = path('envId'),
    locationIdExtractor: RequestValueExtractor = path('locationId')
): ParamExtractor<TenantEnvironmentLocation> {
    return (req: RequestContext) => {
        const tenantId = tenantIdParam(tenantIdExtractor)(req);
        if (tenantId._type === 'failure') {
            return tenantId;
        }
        const environmentId = environmentIdParam(environmentIdExtractor)(req);
        if (environmentId._type === 'failure') {
            return environmentId;
        }
        const locationId = locationIdParam(locationIdExtractor)(req);
        if (locationId._type === 'failure') {
            return locationId;
        }
        return success(tenantEnvironmentLocation(environmentId.value, tenantId.value, locationId.value));
    };
}


export function asHandler(factory: EndpointDependenciesFactory, req: express.Request, res: express.Response): Handler {
    const httpRequest = asRequestContext(req);
    const deps = factory(httpRequest);
    return {
        async withFourRequestParams<A, B, C, D>(aParam: ParamExtractor<A>,
                                          bParam: ParamExtractor<B>,
                                          cParam: ParamExtractor<C>,
                                          dParam: ParamExtractor<D>, fn: (deps: EndpointDependencies, a: A, b: B, c: C, d: D) => Promise<HttpResponse>): Promise<void> {
            const a = aParam(httpRequest);
            if (a._type === 'failure') {
                return asExpressResponse(a.value, res);
            }
            const b = bParam(httpRequest);
            if (b._type === 'failure') {
                return asExpressResponse(b.value, res);
            }
            const c = cParam(httpRequest);
            if (c._type === 'failure') {
                return asExpressResponse(c.value, res);
            }
            const d = dParam(httpRequest);
            if (d._type === 'failure') {
                return asExpressResponse(d.value, res);
            }
            const response = await fn(deps, a.value, b.value, c.value, d.value);
            asExpressResponse(response, res);
        }
    }
}