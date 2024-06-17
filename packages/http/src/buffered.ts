import * as bodies from "./bodies.js";
import {HttpRequest, HttpResponse} from "./contract.js";
import {isRequest} from "./messages.js";
import {Uri} from "./uri.js";

export interface BufferedHttpRequest extends HttpRequest {
    readonly uri: Uri,
    readonly body: Uint8Array;
}

export interface BufferedHttpResponse extends HttpResponse {
    readonly body: Uint8Array;
}

export function bufferBinary(request: HttpRequest): Promise<BufferedHttpRequest>;
export function bufferBinary(response: HttpResponse): Promise<BufferedHttpResponse>;
export async function bufferBinary(message: HttpRequest | HttpResponse): Promise<BufferedHttpRequest | BufferedHttpResponse> {
    return isRequest(message)
        ? {...message, uri: Uri.of(message.uri), body: await bodies.bufferBinary(message.body)}
        : {...message, body: await bodies.bufferBinary(message.body)}
}

export interface TextHttpRequest extends HttpRequest {
    readonly uri: Uri,
    readonly body: string;
}

export interface TextHttpResponse extends HttpResponse {
    readonly body: string;
}

export function bufferText(request: HttpRequest): Promise<TextHttpRequest>;
export function bufferText(response: HttpResponse): Promise<TextHttpResponse>;
export async function bufferText(message: HttpRequest | HttpResponse): Promise<TextHttpRequest | TextHttpResponse> {
    return isRequest(message)
        ? {...message, uri: Uri.of(message.uri), body: await bodies.bufferText(message.body)}
        : {...message, body: await bodies.bufferText(message.body)}
}
