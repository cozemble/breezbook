import {Header, HeaderName, HeaderValue, HttpBody, HttpMessage, HttpRequest, HttpResponse} from "./contract.js";
import * as h from "./headers.js";
import * as headers from "./headers.js";
import {HeaderValueLike, isHeader, isHeaderValue} from "./headers.js";
import * as b from "./bodies.js";
import {modify} from "./util/objects.js";

/*
* these operate on headers in a case-insensitive way
* while headers themselves can have any casing they like and we preserve it.
* */
export function setHeader<T extends HttpMessage>(message: T, name: HeaderName, value: HeaderValueLike): T ;
export function setHeader<T extends HttpMessage>(message: T, header: Header): T ;
export function setHeader<T extends HttpMessage>(message: T, headerOrName: Header | HeaderName, maybeValue?: HeaderValueLike): T {
    if (isHeader(headerOrName))
        return modify(message, {headers: h.setHeader(message.headers, headerOrName)} as Partial<T>);
    else if (isHeaderValue(maybeValue))
        return modify(message, {headers: h.setHeader(message.headers, headerOrName, maybeValue)} as Partial<T>);
    else
        throw new Error(`Not a valid header value: ${maybeValue}`);
}

export function setHeaders<T extends HttpMessage>(message: T, ...headers: (Header | undefined)[]): T {
    return headers.reduce(
        (message, header) => {
            if (!header) return message;
            return setHeader(message, header);
        },
        message)
}


/**
 * Case insensitive on name
 */
export function getHeaderValue(message: HttpMessage, name: HeaderName): HeaderValue | undefined {
    return headers.getHeaderValue(message.headers, name);
}

/**
 * Case insensitive on name
 */
export function getHeader(message: HttpMessage, name: HeaderName): Header | undefined {
    return headers.getHeader(message.headers, name);
}

/**
 * Case insensitive on name
 */
export function getHeaderValues(message: HttpMessage, name: HeaderName): HeaderValue[] {
    return headers.getHeaderValues(message.headers, name);
}

export function appendHeader<T extends HttpMessage>(message: T, name: HeaderName, value: HeaderValueLike): T ;
export function appendHeader<T extends HttpMessage>(message: T, header: Header): T ;
export function appendHeader<T extends HttpMessage>(message: T, headerOrName: Header | HeaderName, maybeValue?: HeaderValueLike): T {
    if (isHeader(headerOrName))
        return modify(message, {headers: h.appendHeader(message.headers, headerOrName)} as Partial<T>);
    else
        return modify(message, {headers: h.appendHeader(message.headers, headerOrName, maybeValue as HeaderValueLike)} as Partial<T>);
}

export function appendHeaders<T extends HttpMessage>(message: T, ...headers: (Header|undefined)[]): T {
    return modify(message, {headers: h.appendHeaders(message.headers, ...headers)} as Partial<T>)
}

export function removeHeaders<T extends HttpMessage>(message: T, ...names: HeaderName[]): T {
    return modify(message, {headers: h.removeHeaders(message.headers, ...names)} as Partial<T>);
}

export function selectHeaders<T extends HttpMessage>(message: T, ...names: HeaderName[]): T {
    return modify(message, {headers: h.selectHeaders(message.headers, ...names)} as Partial<T>);
}

export function updateHeaders<T extends HttpMessage>(message: T, name: HeaderName, f: (value: HeaderValue) => HeaderValue): T {
    return modify(message, {headers: h.updateHeaders(message.headers, name, f)} as Partial<T>);
}

export function setBody<T extends HttpMessage>(message: T, body: HttpBody): T {
    return modify(message, {body} as Partial<T>);
}

export async function bufferText<T extends HttpMessage>(message: T): Promise<T> {
    return setBody(message, await b.bufferText(message.body));
}

export async function bufferedText(message: HttpMessage): Promise<string> {
    return await b.bufferText(message.body);
}

export function isResponse(message: HttpMessage): message is HttpResponse {
    return message.hasOwnProperty("status");
}

export function isRequest(message: HttpMessage): message is HttpRequest {
    return message.hasOwnProperty("method");
}

/* turns streaming bodies into text bodies so that messages are directly json serialisable  */
export async function toJSON<T extends HttpMessage>(message: T): Promise<T> {
    return {...message, body: await b.bufferText(message.body)}
}
