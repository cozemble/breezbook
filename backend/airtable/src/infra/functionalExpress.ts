import express from 'express';
import {isoDate, IsoDate, Order, serviceId, ServiceId, tenantId, TenantId} from "../types.js";

export interface RequestValueExtractor {
    name: string;
    extractor: (req: express.Request) => string | null;
}

export function query(paramName: string): RequestValueExtractor {
    const extractor = (req: express.Request) => {
        const paramValue = req.query[paramName];
        if (!paramValue) {
            return null;
        }
        return paramValue as string;
    }
    return {name: paramName, extractor};
}

export function path(paramName: string): RequestValueExtractor {
    const extractor = (req: express.Request) => {
        const paramValue = req.params[paramName];
        if (!paramValue) {
            return null;
        }
        return paramValue;
    }
    return {name: paramName, extractor};
}

type ParamExtractor<T> = (req: express.Request, res: express.Response) => T | null

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
    }
}

export function orderBody(): ParamExtractor<Order | null> {
    return (req: express.Request, res: express.Response) => {
        const body = req.body as Order | null
        if (!body) {
            res.status(400).send(`Missing required body`);
            return null;
        }
        if (body._type !== "order") {
            res.status(400).send(`Posted body is not an order`);
            return null;
        }
        return body
    }
}

export function tenantIdParam(requestValue: RequestValueExtractor = path("tenantId")): ParamExtractor<TenantId | null> {
    return (req: express.Request, res: express.Response) => {
        const paramValue = requestValue.extractor(req);
        if (!paramValue) {
            res.status(400).send(`Missing required parameter tenantId`);
            return null;
        }
        return tenantId(paramValue);
    }
}

export function serviceIdParam(requestValue: RequestValueExtractor = path("serviceId")): ParamExtractor<ServiceId | null> {
    return (req: express.Request, res: express.Response) => {
        const paramValue = requestValue.extractor(req);
        if (!paramValue) {
            res.status(400).send(`Missing required parameter serviceId`);
            return null;
        }
        return serviceId(paramValue);
    }
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

export async function withOneRequestParam<T>(req: express.Request, res: express.Response, aParam: ParamExtractor<T | null>, f: (t: T) => Promise<void>): Promise<void> {
    const a = aParam(req, res);
    if (a === null) {
        return;
    }

    return await withErrorHandling(res, async () => await f(a));
}

export async function withTwoRequestParams<A, B>(req: express.Request, res: express.Response, aParam: ParamExtractor<A | null>, bParam: ParamExtractor<B | null>, f: (a: A, b: B) => Promise<void>): Promise<void> {
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

export async function withFourRequestParams<A, B, C, D>(req: express.Request, res: express.Response, aParam: ParamExtractor<A | null>, bParam: ParamExtractor<B | null>, cParam: ParamExtractor<C | null>, dParam: ParamExtractor<D | null>, f: (a: A, b: B, c: C, d: D) => Promise<void>): Promise<void> {
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
