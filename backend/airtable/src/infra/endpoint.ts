import {PrismaClient} from "@prisma/client";
import {failure, Failure, success, Success,} from "@breezbook/packages-core";
import {prismaClient} from "../prisma/client.js";
import express from "express";
import {Mutations} from "../mutation/mutations.js";
import {applyMutations} from "../prisma/applyMutations.js";
import {inngest} from "../inngest/client.js";
import {asRequestContext, PostedFile, RequestContext, sendExpressResponse} from "./http/expressHttp4t.js";
import {query as httpQuery} from "@breezbook/packages-http/dist/queries.js";
import {HttpResponse} from "@breezbook/packages-http/dist/contract.js";
import {responseOf} from "@breezbook/packages-http/dist/responses.js";
import {
    environmentId,
    EnvironmentId,
    isoDate,
    IsoDate,
    languageId,
    LanguageId,
    languages,
    locationId,
    LocationId,
    serviceId,
    ServiceId,
    tenantEnvironment,
    TenantEnvironment,
    tenantEnvironmentLocation,
    TenantEnvironmentLocation,
    tenantId,
    TenantId
} from "@breezbook/packages-types";

export type EventSender = (event: { name: string, data: any }) => Promise<void>;

export interface EndpointDependencies {
    prisma: PrismaClient
    eventSender: EventSender
}

export type EndpointDependenciesFactory = (request: RequestContext) => EndpointDependencies;

export interface Handler {
    withOneRequestParam<A>(aParam: ParamExtractor<A>,
                           f: (deps: EndpointDependencies, a: A) => Promise<EndpointOutcome[]>): Promise<EndpointOutcome[]>

    withTwoRequestParams<A, B>(aParam: ParamExtractor<A>,
                               bParam: ParamExtractor<B>,
                               f: (deps: EndpointDependencies, a: A, b: B) => Promise<EndpointOutcome[]>): Promise<EndpointOutcome[]>

    withThreeRequestParams<A, B, C>(aParam: ParamExtractor<A>,
                                    bParam: ParamExtractor<B>,
                                    cParam: ParamExtractor<C>,
                                    f: (deps: EndpointDependencies, a: A, b: B, c: C) => Promise<EndpointOutcome[]>): Promise<EndpointOutcome[]>

    withFourRequestParams<A, B, C, D>(aParam: ParamExtractor<A>,
                                      bParam: ParamExtractor<B>,
                                      cParam: ParamExtractor<C>,
                                      dParam: ParamExtractor<D>,
                                      f: (deps: EndpointDependencies, a: A, b: B, c: C, d: D) => Promise<EndpointOutcome[]>): Promise<EndpointOutcome[]>
}

export interface RequestValueExtractor {
    name: string;
    extractor: (req: RequestContext) => string | null;
}

export function query(paramName: string): RequestValueExtractor {
    const extractor = (req: RequestContext) => httpQuery(req.request.uri.query, paramName) ?? null;
    return {name: paramName, extractor};
}

export function defaultValue(value: string, requestValue: RequestValueExtractor): RequestValueExtractor {
    const extractor = (req: RequestContext) => requestValue.extractor(req) ?? value;
    return {name: requestValue.name, extractor};
}

export function path(paramName: string): RequestValueExtractor {
    const extractor = (req: RequestContext) => req.params[paramName] ?? null;
    return {name: paramName, extractor};
}

export type ParamExtractorOutcome<T = unknown> = Success<T> | Failure<HttpResponse>;
export type ParamExtractor<T> = (req: RequestContext) => ParamExtractorOutcome<T>;

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

export function languageIdParam(requestValue: RequestValueExtractor = defaultValue(languages.en.value, query('lang'))): ParamExtractor<LanguageId> {
    return paramExtractor('lang', requestValue.extractor, languageId);
}

export function postedFile(name: string): ParamExtractor<PostedFile> {
    return (req: RequestContext) => {
        const file = req.files[name] ?? null
        if (!file) {
            return failure(responseOf(400, `Missing required file ${name}`));
        }
        return success(file);
    };
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
    return specifiedDeps(prismaClient(), (event) => inngest.send(event).then(console.log).catch(console.error));
}

export function specifiedDeps(prisma: PrismaClient, eventSender: EventSender): EndpointDependencies {
    return {
        prisma,
        eventSender
    }
}

function failureOutcome(...outcomes: ParamExtractorOutcome[]) {
    const firstFailure = outcomes.find(o => o._type === 'failure');
    if (firstFailure && firstFailure._type === 'failure') {
        return [httpResponseOutcome(firstFailure.value)];
    }
    throw new Error(`No failure outcome found in ${outcomes}`);
}

export function asHandler(deps: EndpointDependencies, httpRequest: RequestContext): Handler {
    return {
        async withOneRequestParam<A>(aParam: ParamExtractor<A>,
                                     fn: (deps: EndpointDependencies, a: A) => Promise<EndpointOutcome[]>): Promise<EndpointOutcome[]> {
            const [a] = [aParam(httpRequest)];
            if (a._type === 'success') {
                return fn(deps, a.value);
            }
            return failureOutcome(a);
        },
        async withTwoRequestParams<A, B>(aParam: ParamExtractor<A>,
                                         bParam: ParamExtractor<B>,
                                         fn: (deps: EndpointDependencies, a: A, b: B) => Promise<EndpointOutcome[]>): Promise<EndpointOutcome[]> {
            const [a, b] = [aParam(httpRequest), bParam(httpRequest)];
            if (a._type === 'success' && b._type === 'success') {
                return fn(deps, a.value, b.value);
            }
            return failureOutcome(a, b);
        },
        async withThreeRequestParams<A, B, C>(aParam: ParamExtractor<A>,
                                              bParam: ParamExtractor<B>,
                                              cParam: ParamExtractor<C>, fn: (deps: EndpointDependencies, a: A, b: B, c: C) => Promise<EndpointOutcome[]>): Promise<EndpointOutcome[]> {
            const [a, b, c] = [aParam(httpRequest), bParam(httpRequest), cParam(httpRequest)];
            if (a._type === 'success' && b._type === 'success' && c._type === 'success') {
                return fn(deps, a.value, b.value, c.value);
            }
            return failureOutcome(a, b, c);
        },
        async withFourRequestParams<A, B, C, D>(aParam: ParamExtractor<A>,
                                                bParam: ParamExtractor<B>,
                                                cParam: ParamExtractor<C>,
                                                dParam: ParamExtractor<D>, fn: (deps: EndpointDependencies, a: A, b: B, c: C, d: D) => Promise<EndpointOutcome[]>): Promise<EndpointOutcome[]> {
            const [a, b, c, d] = [aParam(httpRequest), bParam(httpRequest), cParam(httpRequest), dParam(httpRequest)];
            if (a._type === 'success' && b._type === 'success' && c._type === 'success' && d._type === 'success') {
                return fn(deps, a.value, b.value, c.value, d.value);
            }
            return failureOutcome(a, b, c, d);
        }
    }
}

interface HttpResponseOutcome {
    _type: 'http.response.outcome';
    response: HttpResponse;
}

interface MutationOutcome {
    _type: 'mutation.outcome';
    mutations: Mutations;
    tenantEnvironment: TenantEnvironment;
}

interface SendEventOutcome {
    _type: 'send.event.outcome';
    event: { name: string, data: any };
}

export function httpResponseOutcome(response: HttpResponse): HttpResponseOutcome {
    return {response, _type: 'http.response.outcome'};
}

export function mutationOutcome(tenantEnvironment: TenantEnvironment, mutations: Mutations): MutationOutcome {
    return {mutations, tenantEnvironment, _type: 'mutation.outcome'};
}

export function sendEventOutcome(event: { name: string, data: any }): SendEventOutcome {
    return {event, _type: 'send.event.outcome'};
}

export type EndpointOutcome = HttpResponseOutcome | MutationOutcome | SendEventOutcome;

export type Endpoint = (deps: EndpointDependencies, req: RequestContext) => Promise<EndpointOutcome[]>;

export async function expressBridge(depsFactory: EndpointDependenciesFactory, f: Endpoint, req: express.Request, res: express.Response): Promise<void> {
    const requestContext = asRequestContext(req);
    const deps = depsFactory(requestContext);
    const outcomes = await f(deps, requestContext);
    for (const outcome of outcomes) {
        if (outcome._type === 'http.response.outcome') {
            sendExpressResponse(outcome.response, res);
        }
        if (outcome._type === 'send.event.outcome') {
            await deps.eventSender(outcome.event);
        }
        if (outcome._type === 'mutation.outcome') {
            await applyMutations(deps.prisma, outcome.tenantEnvironment, outcome.mutations.mutations)
        }
    }
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

