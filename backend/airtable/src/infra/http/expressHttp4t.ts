import {Header, HttpRequest, HttpResponse} from "@breezbook/packages-http/dist/contract.js";
import express from "express";
import {requestOf} from "@breezbook/packages-http/dist/requests.js";

export function sendExpressResponse(response: HttpResponse, res: express.Response): void {
    res.status(response.status)
    response.headers.forEach(h => res.setHeader(h[0], h[1]))
    if (response.body && response.body !== "") {
        res.send(response.body)
    } else {
        res.send(response.statusDescription ?? "")
    }
}

export type PostedFile = Express.Multer.File

export interface RequestContext {
    request: HttpRequest;
    params: Record<string, string>;
    files: Record<string, PostedFile>;
}

export function requestContext(request: HttpRequest, params: Record<string, string>, files: Record<string, PostedFile>): RequestContext {
    return {request, params, files}
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
    let files = {} as Record<string, PostedFile>
    if (req.files) {
        files = (req.files as Express.Multer.File[]).reduce((acc, file) => ({...acc, [file.fieldname]: file}), files)
    }
    if(req.file) {
        files = {...files, [req.file.fieldname]: req.file}
    }
    return requestContext(requestOf(req.method, req.url, req.body, ...theHeaders), req.params, files)
}
