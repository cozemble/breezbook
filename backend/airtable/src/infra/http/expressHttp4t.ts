import express from "express";
import {Header, HttpRequest, HttpResponse} from "@http4t/core/contract.js";
import {requestOf} from "@http4t/core/requests.js";

export function sendExpressResponse(response: HttpResponse, res: express.Response): void {
    res.status(response.status)
    response.headers.forEach(h => res.setHeader(h[0], h[1]))
    if (response.body && response.body !== "") {
        res.send(response.body)
    } else {
        res.send(response.statusDescription ?? "")
    }
}

export interface RequestContext {
    request: HttpRequest;
    params: { [key: string]: string };
}

export function requestContext(request: HttpRequest, params: { [key: string]: string }): RequestContext {
    return {request, params}
}

export function asRequestContext(req: express.Request): RequestContext {
    const theHeaders = Object.keys(req.headers).reduce((acc, key) => {
        const value = req.headers[key]
        if (typeof value === "string") {
            const header: Header = [key, value]
            return [...acc, header]
        }
        return acc
    }, [] as Header[])
    return requestContext(requestOf(req.method, req.url, req.body, ...theHeaders), req.params)
}
