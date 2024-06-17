/**
 * The HTTP contract defines the simplest representation of the actual wire format of HTTP.
 * The API must support both client and server implementation/usage so is a uniform interface
 */


/**
 * The standard HTTP method type as defined by [RFC 7230](https://tools.ietf.org/html/rfc7230) or an extension
 */
export type Method =
    'GET'
    | 'POST'
    | 'PUT'
    | 'PATCH'
    | 'DELETE'
    | 'HEAD'
    | 'OPTIONS'
    | 'TRACE'
    | 'CONNECT'
    | 'UPGRADE'
    | string;

/**
 * Header is a name value pair
 */
export type Header = readonly [HeaderName, HeaderValue];

/**
 * The standard HTTP header name as defined by [RFC 7230](https://tools.ietf.org/html/rfc7230) or an extension
 */
export type HeaderName =
    'Accept'
    | 'Accept-Charset'
    | 'Accept-Encoding'
    | 'Accept-Language'
    | 'Authorization'
    | 'Cache-Control'
    | 'Content-Encoding'
    | 'Content-Language'
    | 'Content-Length'
    | 'Content-Location'
    | 'Content-Type'
    | 'Content-MD5'
    | 'Date'
    | 'ETag'
    | 'Expires'
    | 'Host'
    | 'If-Match'
    | 'If-Modified-Since'
    | 'If-None-Match'
    | 'If-Unmodified-Since'
    | 'Last-Modified'
    | 'Location'
    | 'User-Agent'
    | 'Vary'
    | 'WWW-Authenticate'
    | 'Cookie'
    | 'Set-Cookie'
    | 'X-Forwarded-For'
    | 'X-Forwarded-Proto'
    | 'X-Forwarded-Host'
    | 'X-Frame-Options'
    | 'X-CorrelationID'
    | 'Transfer-Encoding'
    | 'Access-Control-Allow-Origin'
    | string ;

/**
 * Header value is a string.
 */
export type HeaderValue = string ;

/**
 * Data can either be text or binary
 */
export type Data = string | Uint8Array;

/**
 * SyncBody can be fixed or unknown length.
 */
export type SyncBody = Data | Iterable<Data>;

/**
 * AsyncBody can be fixed or unknown length.
 */
export type AsyncBody = Promise<Data> | AsyncIterable<Data>;

/**
 * Body can either be synchronous or asynchronous
 */
export type HttpBody = SyncBody | AsyncBody;

/**
 * ParsedUri as specified by [RFC 3986](https://tools.ietf.org/html/rfc3986)
 */
export interface ParsedUri {
    readonly scheme?: string;
    readonly authority?: ParsedAuthority;
    readonly path: string;
    readonly query?: string;
    readonly fragment?: string;
}

export interface ParsedAuthority {
    readonly user?: string;
    readonly host: string;
    readonly port?: number;
}

/**
 * HttpMessage contain headers followed by an optional body
 */
export interface HttpMessage {
    readonly headers: readonly  Header[],
    readonly body: HttpBody
}

export function isMessage(value: any): value is HttpMessage {
    return value.hasOwnProperty('body') && value.hasOwnProperty('headers');
}

/**
 * HttpRequest is made up of a method, uri and optional version followed by the headers and optional body
 */
export interface HttpRequest extends HttpMessage {
    readonly method: Method
    readonly uri: ParsedUri,
    /**
     * httpVersion is not available in all implementations so is optional
     */
    readonly httpVersion?: string,
}

/**
 * HttpResponse is made up of an optional version, status (code) and optional description followed by the headers and optional body
 */
export interface HttpResponse extends HttpMessage {
    /**
     * httpVersion is not available in all implementations so is optional
     */
    readonly httpVersion?: string,
    readonly status: number,
    /**
     * statusDescription is not available in all implementations so is optional
     */
    readonly statusDescription?: string,
}

/**
 * HttpHandler takes a request and returns a Response.
 * Used by clients and servers
 */
export interface HttpHandler {
    handle(request: HttpRequest): Promise<HttpResponse>;
}
