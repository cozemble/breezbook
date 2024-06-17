import {HttpHandler, HttpRequest, HttpResponse} from "./contract.js";

export type HttpHandlerFn = (request: HttpRequest) => Promise<HttpResponse>;

export function handler(f: HttpHandler['handle']): HttpHandler {
    return {handle: f};
}