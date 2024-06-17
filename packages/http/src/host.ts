import {HttpHandler, HttpRequest, HttpResponse} from "./contract.js";
import {setHeader} from "./messages.js";

/**
 * Sets Host header on requests
 */
export class HostHandler implements HttpHandler {
    constructor(private handler: HttpHandler, private host: string) {
    }

    handle(request: HttpRequest): Promise<HttpResponse> {
        return this.handler.handle(setHeader(request, 'Host', this.host));
    }
}
