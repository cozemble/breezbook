import {Data, HttpBody} from "./contract.js";
import {DECODER, ENCODER} from "./util/textencoding.js";

function wrongBodyType(body: never) {
    return new Error(`Not a valid HttpBody: '${body}' (${typeDescription(body)})`);
}

/*
-----------------------------------
Core functions
-----------------------------------
 */
export async function bufferText(body: HttpBody): Promise<string> {
    if (isPromiseLike(body)) {
        return asString(await body);
    }
    if (isAsyncIterable(body)) {
        let result = "";
        for await (const data of body) {
            result += asString(data);
        }
        return result;
    }
    if (isData(body)) {
        return asString(body);
    }
    if (isIterable(body)) {
        return Array.from(body).map(asString).join("")
    }
    throw wrongBodyType(body);
}

export async function bufferBinary(body: HttpBody): Promise<Uint8Array> {
    if (isPromiseLike(body)) {
        return asBinary(await body);
    }
    if (isAsyncIterable(body)) {
        let result: Uint8Array | undefined = undefined;
        for await (const data of body) {
            result = merge(result, asBinary(data));
        }
        return result || new Uint8Array();
    }
    if (isData(body)) {
        return asBinary(body);
    }
    if (isIterable(body)) {
        return Array.from(body).map(asBinary).reduce(merge)
    }
    throw wrongBodyType(body);
}

export async function* streamText(body: HttpBody): AsyncIterable<string> {
    if (isPromiseLike(body)) {
        yield asString(await body);
        return;
    }

    if (isAsyncIterable(body)) {
        for await (const data of body) {
            yield asString(data);
        }
        return;
    }

    if (isData(body)) {
        yield asString(body);
        return;
    }

    if (isIterable(body)) {
        for await (const data of body) {
            yield asString(data);
        }
        return;
    }
    throw wrongBodyType(body)
}

export async function* streamBinary(body: HttpBody): AsyncIterable<Uint8Array> {
    if (isPromiseLike(body)) {
        yield asBinary(await body);
        return;
    }
    if (isAsyncIterable(body)) {
        for await(const chunk of body) {
            yield asBinary(chunk);
        }
        return;
    }
    if (isData(body)) {
        yield asBinary(body);
        return;
    }
    if (isIterable(body)) {
        for (const chunk of body) {
            yield asBinary(chunk);
        }
        return;
    }
    throw wrongBodyType(body)
}

export function asString(data: Data): string {
    if (typeof data === 'string') return data;
    // noinspection SuspiciousTypeOfGuard
    if (data instanceof Uint8Array) return DECODER.decode(data);
    throw new Error(`Not supported ${typeDescription(data)}`)
}

export function asBinary(data: Data): Uint8Array {
    if (data instanceof Uint8Array) return data;
    // noinspection SuspiciousTypeOfGuard
    if (typeof data === 'string') return ENCODER.encode(data);
    throw new Error(`Not supported ${typeDescription(data)}`)
}

/*
-----------------------------------
Helpers
-----------------------------------
 */

/**
 * This is janky but the error messages are so useful when you screw something up
 */
export function typeDescription(x: any): string {
    if (x === null)
        return 'null';

    let t = typeof x;
    if (t !== 'object') return t;

    const p = Object.getPrototypeOf(x);
    if (p !== Object.prototype)
        return p.constructor.name;

    return t
}

export function isAsyncIterable(instance: any): instance is AsyncIterable<any> {
    return typeof instance == 'object' && Symbol.asyncIterator in instance;
}


export function isIterable(instance: any): instance is Iterable<any> {
    return typeof instance == 'object' && Symbol.iterator in instance;
}


export function isUint8Array(instance: any): instance is Uint8Array {
    return typeof instance == 'object' && instance instanceof Uint8Array;
}

export function isData(instance: any): instance is Data {
    return typeof instance == 'string' || isUint8Array(instance);
}

export function isPromiseLike(instance: any): instance is PromiseLike<any> {
    return typeof instance == 'object' && 'then' in instance;
}

export function merge(a: Uint8Array | undefined, b: Uint8Array): Uint8Array {
    if (!a) return b;
    if (a.length === 0) return b;
    if (b.length === 0) return a;
    const result = new Uint8Array(a.length + b.length);
    result.set(a);
    result.set(b, a.length);
    return result;
}
