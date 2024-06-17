import {Header, HeaderName, HeaderValue} from './contract.js';

/**
 * Case insensitive on name
 */
export function getHeaderValue(headers: readonly Header[] | undefined, name: HeaderName): HeaderValue | undefined {
    if (typeof headers === 'undefined') return undefined;

    const lowerCaseName = name.toLowerCase();
    for (const [n, v] of headers) {
        if (n.toLowerCase() === lowerCaseName)
            return v;
    }
    return undefined;
}

/**
 * Case insensitive on name
 */
export function getHeader(headers: readonly Header[] | undefined, name: HeaderName): Header | undefined {
    if (typeof headers === 'undefined') return undefined;

    const lowerCaseName = name.toLowerCase();
    for (const header of headers) {
        if (header[0].toLowerCase() === lowerCaseName)
            return header;
    }
    return undefined;
}

/**
 * Case insensitive on name
 */
export function getHeaders(headers: readonly Header[] | undefined, name: HeaderName): Header[] {
    if (typeof headers === 'undefined') return [];

    const lowerCaseName = name.toLowerCase();
    const result = [];
    for (const header of headers) {
        if (header[0].toLowerCase() === lowerCaseName)
            result.push(header);
    }
    return result;
}

/**
 * Case insensitive on name
 */
export function getHeaderValues(headers: readonly Header[] | undefined, name: HeaderName): HeaderValue[] {
    if (typeof headers === 'undefined') return [];

    const lowerCaseName = name.toLowerCase();
    return headers
        .filter(([name, _]) => name.toLowerCase() === lowerCaseName)
        .map(([_, value]) => value)
}

export function appendHeader(headers: readonly Header[] | undefined, name: HeaderName, value: HeaderValueLike): readonly Header[] ;
export function appendHeader(headers: readonly Header[] | undefined, header: Header): readonly Header[] ;
export function appendHeader(headers: readonly Header[] | undefined, headerOrName: Header | HeaderName, maybeValue?: HeaderValueLike): readonly Header[] {
    if (isHeader(headerOrName))
        return [...(headers || []), headerOrName];
    else
        return [...(headers || []), header(headerOrName, maybeValue as HeaderValueLike)];
}

export function appendHeaders(headers: readonly (Header | undefined)[] | undefined, ...next: (Header | undefined)[]): readonly Header[] {
    return [...(headers || []), ...(next || [])]
        .filter(h => typeof h !== "undefined") as Header[];
}

/**
 * Replaces header(s) with same name in headers.
 *
 * Case insensitive on header name when replacing
 */
export function setHeader(headers: readonly Header[] | undefined, name: HeaderName, value: HeaderValueLike): readonly Header[] ;
export function setHeader(headers: readonly Header[] | undefined, header: Header): readonly Header[] ;
export function setHeader(headers: readonly Header[] | undefined, headerOrName: Header | HeaderName, maybeValue?: HeaderValueLike): readonly Header[] {
    const lowerCaseHeaderName: string = isHeader(headerOrName)
        ? headerName(headerOrName).toLowerCase()
        : headerOrName.toLowerCase();

    const newHeader = isHeader(headerOrName)
        ? headerOrName
        : header(headerOrName, maybeValue as HeaderValueLike);

    return [...(headers || []).filter(([name]) => name.toLowerCase() !== lowerCaseHeaderName), newHeader];
}

export function updateHeaders(headers: readonly Header[] | undefined, name: HeaderName, f: (value: HeaderValue) => HeaderValue): readonly Header[] {
    const lowerCaseName = name.toLowerCase();
    return (headers || []).map(([name, value]) => (name.toLowerCase() === lowerCaseName) ? [name, f(value)] : [name, value]);
}

export function removeHeader(headers: readonly Header[] | undefined, name: string): readonly Header[] {
    return removeHeaders(headers, name);
}

export function removeHeaders(headers: readonly Header[] | undefined, ...names: HeaderName[]): readonly Header[] {
    const lowerCaseNames = new Set(names.map(n => n.toLowerCase()));
    return (headers || []).filter(([name]) => !lowerCaseNames.has(name.toLowerCase()));
}

export function selectHeaders(headers: readonly Header[] | undefined, ...names: HeaderName[]): readonly Header[] {
    const lowerCaseNames = new Set(names.map(n => n.toLowerCase()));
    return (headers || []).filter(([name]) => lowerCaseNames.has(name.toLowerCase()));
}

export type HeaderValueLike = string | number | Date;

/**
 * Dates will be formatted into the correct format as defined by [RFC 5322](https://tools.ietf.org/html/rfc5322)
 */
export function header(name: HeaderName, value: HeaderValueLike): Header {
    if (typeof value === 'object') return [name, value.toUTCString()]
    return [name, String(value)];
}

export function headerName(header: Header): HeaderName {
    return header[0];
}

export function headerValue(header: Header): HeaderValue {
    return header[1];
}

export function isHeaderName(obj: any): obj is HeaderName {
    return typeof obj === 'string';
}

export function isHeaderValue(obj: any): obj is HeaderValue {
    return typeof obj === 'string';
}

export function isHeader(obj: any): obj is Header {
    return Array.isArray(obj) && obj.length === 2 && isHeaderName(obj[0]) && isHeaderValue(obj[1]);
}

export function toUTC(date: Date): Date {
    const localTimestamp = date.getTime();
    const localOffset = date.getTimezoneOffset() * 60 * 1000; // convert minutes to milliseconds
    const utcTimestamp = localTimestamp - localOffset;
    return new Date(utcTimestamp);
}

export function httpHeaderDate(date?: Date): string {
    const utcDate = toUTC(date || new Date());
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthsOfYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const dayOfWeek = daysOfWeek[utcDate.getUTCDay()];
    const dayOfMonth = utcDate.getUTCDate().toString().padStart(2, "0");
    const month = monthsOfYear[utcDate.getUTCMonth()];
    const year = utcDate.getUTCFullYear();
    const hours = utcDate.getUTCHours().toString().padStart(2, "0");
    const minutes = utcDate.getUTCMinutes().toString().padStart(2, "0");
    const seconds = utcDate.getUTCSeconds().toString().padStart(2, "0");

    return `${dayOfWeek}, ${dayOfMonth} ${month} ${year} ${hours}:${minutes}:${seconds} GMT`;
}