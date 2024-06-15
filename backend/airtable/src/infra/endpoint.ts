import {HttpResponse} from "@http4t/core/contract.js";
import {PrismaClient} from "@prisma/client";
import {asRequestContext, RequestContext, sendExpressResponse} from "./http/expressHttp4t.js";
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
    TenantEnvironment,
    tenantEnvironment,
    tenantEnvironmentLocation,
    TenantEnvironmentLocation,
    tenantId,
    TenantId
} from "@breezbook/packages-core";
import {prismaClient} from "../prisma/client.js";
import express from "express";

export interface EndpointDependencies {
    prisma: PrismaClient
}

export type EndpointDependenciesFactory = (request: RequestContext) => EndpointDependencies;

export interface Handler {
    withTwoRequestParams<A, B>(aParam: ParamExtractor<A>,
                               bParam: ParamExtractor<B>,
                               f: (deps: EndpointDependencies, a: A, b: B) => Promise<HttpResponse>): Promise<HttpResponse>

    withFourRequestParams<A, B, C, D>(aParam: ParamExtractor<A>,
                                      bParam: ParamExtractor<B>,
                                      cParam: ParamExtractor<C>,
                                      dParam: ParamExtractor<D>,
                                      f: (deps: EndpointDependencies, a: A, b: B, c: C, d: D) => Promise<HttpResponse>): Promise<HttpResponse>
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
    locationIdExtractor: RequestValueExtractor = path('locationId')
): ParamExtractor<TenantEnvironmentLocation> {
    return (req: RequestContext) => {
        const tenantEnv = tenantEnvironmentParam()(req);
        if (tenantEnv._type === 'failure') {
            return tenantEnv;
        }
        const locationId = locationIdParam(locationIdExtractor)(req);
        if (locationId._type === 'failure') {
            return locationId;
        }
        return success(tenantEnvironmentLocation(tenantEnv.value.environmentId, tenantEnv.value.tenantId, locationId.value));
    };
}

export function tenantEnvironmentParam(
    tenantIdExtractor: RequestValueExtractor = path('tenantId'),
    environmentIdExtractor: RequestValueExtractor = path('envId')
): ParamExtractor<TenantEnvironment> {
    return (req: RequestContext) => {
        const tenantId = tenantIdParam(tenantIdExtractor)(req);
        if (tenantId._type === 'failure') {
            return tenantId;
        }
        const environmentId = environmentIdParam(environmentIdExtractor)(req);
        if (environmentId._type === 'failure') {
            return environmentId;
        }
        return success(tenantEnvironment(environmentId.value, tenantId.value));
    };
}

export function productionDeps(): EndpointDependencies {
    return specifiedDeps(prismaClient());
}

export function specifiedDeps(prisma: PrismaClient): EndpointDependencies {
    return {
        prisma
    }
}

export function asHandler(deps: EndpointDependencies, httpRequest: RequestContext): Handler {
    return {
        async withTwoRequestParams<A, B>(aParam: ParamExtractor<A>,
                                         bParam: ParamExtractor<B>,
                                         fn: (deps: EndpointDependencies, a: A, b: B) => Promise<HttpResponse>): Promise<HttpResponse> {
            const a = aParam(httpRequest);
            if (a._type === 'failure') {
                return a.value;
            }
            const b = bParam(httpRequest);
            if (b._type === 'failure') {
                return b.value;
            }
            return fn(deps, a.value, b.value);
        },
        async withFourRequestParams<A, B, C, D>(aParam: ParamExtractor<A>,
                                                bParam: ParamExtractor<B>,
                                                cParam: ParamExtractor<C>,
                                                dParam: ParamExtractor<D>, fn: (deps: EndpointDependencies, a: A, b: B, c: C, d: D) => Promise<HttpResponse>): Promise<HttpResponse> {
            const a = aParam(httpRequest);
            if (a._type === 'failure') {
                return a.value;
            }
            const b = bParam(httpRequest);
            if (b._type === 'failure') {
                return b.value;
            }
            const c = cParam(httpRequest);
            if (c._type === 'failure') {
                return c.value;
            }
            const d = dParam(httpRequest);
            if (d._type === 'failure') {
                return d.value;
            }
            return fn(deps, a.value, b.value, c.value, d.value);
        }
    }
}

export type Endpoint = (deps: EndpointDependencies, req: RequestContext) => Promise<HttpResponse>;

export async function expressBridge(depsFactory: EndpointDependenciesFactory, f: Endpoint, req: express.Request, res: express.Response): Promise<void> {
    const requestContext = asRequestContext(req);
    const deps = depsFactory(requestContext);
    sendExpressResponse(await f(deps, requestContext), res);
}

interface ThingWithType {
    _type: string;
}


export function bodyAsJsonParam<T extends ThingWithType>(expectedType: string): ParamExtractor<T> {
    return (req: RequestContext) => {
        const body = req.request.body as unknown as T | null;
        if (!body) {
            return failure(responseOf(400, `Missing required body`));
        }
        if (body._type !== expectedType) {
            return failure(responseOf(400, `Posted body is not a ${expectedType}`));
        }
        return success(body);
    };
}

