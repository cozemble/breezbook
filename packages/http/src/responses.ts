import {Header, HttpBody, HttpResponse} from "./contract.js";

export function responseOf(status: number, body?: HttpBody, ...headers: (Header|undefined)[]): HttpResponse {
    return {status, headers: headers.filter(h=>typeof h !=="undefined") as Header[], body: body ? body : ''}
}

export function ok(body?: HttpBody, ...headers: (Header|undefined)[]): HttpResponse {
    return responseOf(200, body, ...headers);
}

export function notFound(body?: HttpBody, ...headers: (Header|undefined)[]): HttpResponse {
    return responseOf(404, body, ...headers);
}

export function noContent(...headers: (Header|undefined)[]): HttpResponse {
    return responseOf(204, undefined, ...headers);
}

export * from "./messages.js";