import express from 'express';
import {
    bookingId,
    BookingId,
    EnvironmentId,
    environmentId,
    isoDate,
    IsoDate,
    locationId,
    LocationId,
    OrderId,
    orderId,
    serviceId,
    ServiceId,
    tenantEnvironment,
    TenantEnvironment,
    TenantEnvironmentLocation,
    tenantEnvironmentLocation,
    tenantId,
    TenantId
} from '@breezbook/packages-types';
import {ErrorResponse} from '@breezbook/backend-api-types';
import {PrismaClient} from '@prisma/client';
import {Mutations} from '../mutation/mutations.js';
import {applyMutations} from "../prisma/applyMutations.js";

export interface RequestValueExtractor {
    name: string;
    extractor: (req: express.Request) => string | null;
}

export function withDefault(attempt: RequestValueExtractor, defaultValue: string): RequestValueExtractor {
    const extractor = (req: express.Request) => {
        const value = attempt.extractor(req);
        if (!value) {
            return defaultValue;
        }
        return value;
    };
    return {name: attempt.name, extractor};
}

export function query(paramName: string): RequestValueExtractor {
    const extractor = (req: express.Request) => {
        const paramValue = req.query[paramName];
        if (!paramValue) {
            return null;
        }
        return paramValue as string;
    };
    return {name: paramName, extractor};
}

export function path(paramName: string): RequestValueExtractor {
    const extractor = (req: express.Request) => {
        const paramValue = req.params[paramName];
        if (!paramValue) {
            return null;
        }
        return paramValue;
    };
    return {name: paramName, extractor};
}

export type ParamExtractor<T> = (req: express.Request, res: express.Response) => T | null;

export function date(requestValue: RequestValueExtractor): ParamExtractor<IsoDate | null> {
    return (req: express.Request, res: express.Response) => {
        const paramValue = requestValue.extractor(req);
        if (!paramValue) {
            res.status(400).send(`Missing required parameter ${requestValue.name}`);
            return null;
        }
        try {
            return isoDate(paramValue);
        } catch (error) {
            res.status(400).send(`Invalid date format ${paramValue}. Expected YYYY-MM-DD`);
            return null;
        }
    };
}

export function iso8601Timestamp(requestValue: RequestValueExtractor): ParamExtractor<string | null> {
    return (req: express.Request, res: express.Response) => {
        const paramValue = requestValue.extractor(req);
        if (!paramValue) {
            res.status(400).send(`Missing required parameter ${requestValue.name}`);
            return null;
        }
        return paramValue;
    };
}

interface ThingWithType {
    _type: string;
}

export function bodyAsJsonParam<T extends ThingWithType>(expectedType: string): ParamExtractor<T | null> {
    return (req: express.Request, res: express.Response) => {
        const body = req.body as T | null;
        if (!body) {
            res.status(400).send(`Missing required body`);
            return null;
        }
        if (body._type !== expectedType) {
            res.status(400).send(`Posted body is not a ${expectedType}`);
            return null;
        }
        return body;
    };
}


export function tenantIdParam(requestValue: RequestValueExtractor = path('tenantId')): ParamExtractor<TenantId | null> {
    return paramExtractor('tenantId', requestValue.extractor, tenantId);
}

export function environmentIdParam(requestValue: RequestValueExtractor = path('envId')): ParamExtractor<EnvironmentId | null> {
    return paramExtractor('envId', requestValue.extractor, environmentId);
}

export function tenantEnvironmentParam(
    tenantIdExtractor: RequestValueExtractor = path('tenantId'),
    environmentIdExtractor: RequestValueExtractor = path('envId')
): ParamExtractor<TenantEnvironment | null> {
    return (req: express.Request, res: express.Response) => {
        const tenantId = tenantIdParam(tenantIdExtractor)(req, res);
        if (!tenantId) {
            return null;
        }
        const environmentId = environmentIdParam(environmentIdExtractor)(req, res);
        if (!environmentId) {
            return null;
        }
        return tenantEnvironment(environmentId, tenantId);
    };
}

export function tenantEnvironmentLocationParam(
    tenantIdExtractor: RequestValueExtractor = path('tenantId'),
    environmentIdExtractor: RequestValueExtractor = path('envId'),
    locationIdExtractor: RequestValueExtractor = path('envId')
): ParamExtractor<TenantEnvironmentLocation | null> {
    return (req: express.Request, res: express.Response) => {
        const tenantId = tenantIdParam(tenantIdExtractor)(req, res);
        if (!tenantId) {
            return null;
        }
        const environmentId = environmentIdParam(environmentIdExtractor)(req, res);
        if (!environmentId) {
            return null;
        }
        const locationId = locationIdParam(locationIdExtractor)(req, res)
        if (!locationId) {
            return null;
        }
        return tenantEnvironmentLocation(environmentId, tenantId, locationId);
    };
}

export function serviceIdParam(requestValue: RequestValueExtractor = path('serviceId')): ParamExtractor<ServiceId | null> {
    return paramExtractor('serviceId', requestValue.extractor, serviceId);
}

export function locationIdParam(requestValue: RequestValueExtractor = path('locationId')): ParamExtractor<LocationId | null> {
    return paramExtractor('locationId', requestValue.extractor, locationId);
}

export function orderIdParam(requestValue: RequestValueExtractor = path('orderId')): ParamExtractor<OrderId | null> {
    return paramExtractor('orderId', requestValue.extractor, orderId);
}

export function bookingIdParam(requestValue: RequestValueExtractor = path('bookingId')): ParamExtractor<BookingId | null> {
    return paramExtractor('bookingId', requestValue.extractor, bookingId);
}

export function cancellationId(requestValue: RequestValueExtractor = path('cancellationId')): ParamExtractor<string | null> {
    return paramExtractor('cancellationId', requestValue.extractor, (s) => s);
}

export function paramExtractor<T>(
    paramName: string,
    extractor: (req: express.Request) => string | null,
    factoryFn: (s: string) => T
): ParamExtractor<T | null> {
    return (req: express.Request, res: express.Response) => {
        const paramValue = extractor(req);
        if (!paramValue) {
            res.status(400).send(`Missing required parameter ${paramName}`);
            return null;
        }
        return factoryFn(paramValue);
    };
}

export async function withErrorHandling(res: express.Response, f: () => Promise<void>): Promise<void> {
    try {
        return await f();
    } catch (e: unknown) {
        console.error(e);
        if (e instanceof Error) {
            res.status(500).send(e.message);
        } else {
            res.status(500).send('An unknown error occurred.');
        }
    }
}

export async function withThreeRequestParams<A, B, C>(
    req: express.Request,
    res: express.Response,
    aParam: ParamExtractor<A | null>,
    bParam: ParamExtractor<B | null>,
    cParam: ParamExtractor<C | null>,
    f: (a: A, b: B, c: C) => Promise<void>
): Promise<void> {
    const a = aParam(req, res);
    if (a === null) {
        return;
    }
    const b = bParam(req, res);
    if (b === null) {
        return;
    }
    const c = cParam(req, res);
    if (c === null) {
        return;
    }

    return await withErrorHandling(res, async () => await f(a, b, c));
}

export async function withOneRequestParam<A>(
    req: express.Request,
    res: express.Response,
    aParam: ParamExtractor<A | null>,
    f: (a: A) => Promise<void>
): Promise<void> {
    const a = aParam(req, res);
    if (a === null) {
        return;
    }
    return await withErrorHandling(res, async () => await f(a));
}

export async function withNoRequestParams<A>(
    req: express.Request,
    res: express.Response,
    f: () => Promise<void>
): Promise<void> {
    return await withErrorHandling(res, async () => await f());
}

export async function withTwoRequestParams<A, B>(
    req: express.Request,
    res: express.Response,
    aParam: ParamExtractor<A | null>,
    bParam: ParamExtractor<B | null>,
    f: (a: A, b: B) => Promise<void>
): Promise<void> {
    const a = aParam(req, res);
    if (a === null) {
        return;
    }
    const b = bParam(req, res);
    if (b === null) {
        return;
    }
    return await withErrorHandling(res, async () => await f(a, b));
}

export async function withFourRequestParams<A, B, C, D>(
    req: express.Request,
    res: express.Response,
    aParam: ParamExtractor<A | null>,
    bParam: ParamExtractor<B | null>,
    cParam: ParamExtractor<C | null>,
    dParam: ParamExtractor<D | null>,
    f: (a: A, b: B, c: C, d: D) => Promise<void>
): Promise<void> {
    const a = aParam(req, res);
    if (a === null) {
        return;
    }
    const b = bParam(req, res);
    if (b === null) {
        return;
    }
    const c = cParam(req, res);
    if (c === null) {
        return;
    }
    const d = dParam(req, res);
    if (d === null) {
        return;
    }
    return await withErrorHandling(res, async () => await f(a, b, c, d));
}

export async function withFiveRequestParams<A, B, C, D, E>(
    req: express.Request,
    res: express.Response,
    aParam: ParamExtractor<A | null>,
    bParam: ParamExtractor<B | null>,
    cParam: ParamExtractor<C | null>,
    dParam: ParamExtractor<D | null>,
    eParam: ParamExtractor<E | null>,
    f: (a: A, b: B, c: C, d: D, e: E) => Promise<void>
): Promise<void> {
    const a = aParam(req, res);
    if (a === null) {
        return;
    }
    const b = bParam(req, res);
    if (b === null) {
        return;
    }
    const c = cParam(req, res);
    if (c === null) {
        return;
    }
    const d = dParam(req, res);
    if (d === null) {
        return;
    }
    const e = eParam(req, res);
    if (e === null) {
        return;
    }
    return await withErrorHandling(res, async () => await f(a, b, c, d, e));
}

export function sendJson<T>(res: express.Response, data: T, status = 200): void {
    res.setHeader('Content-Type', 'application/json');
    res.status(status).send(JSON.stringify(data));
}

export interface HttpError {
    _type: 'http.error';
    message?: string;
    status: number;
}

export function httpError(status: number, message?: string): HttpError {
    return {_type: 'http.error', status, message};
}

export interface HttpJsonResponse {
    _type: 'http.json.response';
    status: number;
    body: unknown;
}

export function httpJsonResponse(status: number, body: unknown): HttpJsonResponse {
    return {_type: 'http.json.response', status, body};
}


export async function handleOutcome(
    res: express.Response,
    prisma: PrismaClient,
    tenantEnvironment: TenantEnvironment,
    outcome: Mutations | HttpError | ErrorResponse,
    response: HttpJsonResponse | null = null
): Promise<void> {
    if (outcome._type === 'http.error') {
        res.status(outcome.status).send(outcome.message);
        return;
    }
    if (outcome._type === 'error.response') {
        res.status(400).send(outcome);
        return;
    }
    await applyMutations(prisma, tenantEnvironment, outcome.mutations)
    if (response) {
        return sendJson(res, response.body, response.status);
    } else {
        res.status(200).send();
    }
}

