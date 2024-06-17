import {ParsedAuthority, ParsedUri} from "./contract.js";

/**
 * UriLike is either unparsed or parsed
 */
export type UriLike = string | ParsedUri;

export class Uri implements ParsedUri {
    readonly scheme?: string;
    readonly authority?: ParsedAuthority;
    readonly path: string;
    readonly query?: string;
    readonly fragment?: string;

    constructor({scheme, authority, path, query, fragment}: ParsedUri) {
        this.scheme = scheme;
        this.authority = authority;
        this.path = path;
        this.query = query;
        this.fragment = fragment;
    }

    static RFC_3986 = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;

    /** {@link https://tools.ietf.org/html/rfc3986#appendix-B } */
    static parse(uri: string) {
        const match = Uri.RFC_3986.exec(uri);
        if (!match) throw new Error(`Invalid Uri: ${uri}`);
        const [, , scheme, , authorityString, path, , query, , fragment] = match;
        const authority = typeof authorityString !== 'undefined' ? Authority.parse(authorityString) : undefined;
        return new Uri({scheme, authority, path, query, fragment});
    }

    static of(uri: UriLike): Uri {
        if (uri instanceof Uri) return uri;
        return typeof uri === 'string' ? Uri.parse(uri) : new Uri(uri);
    }

    static modify(uri: ParsedUri, modifications: Partial<ParsedUri>): Uri {
        return new Uri(Object.assign({}, uri, modifications))
    }

    /** {@link https://tools.ietf.org/html/rfc3986#section-5.3} */
    toString() {
        const result: string[] = [];

        if (typeof this.scheme != 'undefined') result.push(this.scheme, ":");
        if (typeof this.authority != 'undefined') result.push("//", Authority.of(this.authority).toString());
        const path = this.path === "" || this.path.startsWith("/") ? this.path : `/${this.path}`
        result.push(path);
        if (typeof this.query != 'undefined') result.push("?", this.query);
        if (typeof this.fragment != 'undefined') result.push("#", this.fragment);
        return result.join('');
    }

    toJSON() {
        return this.toString();
    }
}

export class Authority implements ParsedAuthority {
    readonly user?: string;
    readonly host: string;
    readonly port?: number;

    constructor({user, host, port}: ParsedAuthority) {
        if (typeof port !== 'undefined' && Number.isNaN(port)) throw Error("Port was NaN");
        if (user) this.user = user;
        this.host = host;
        if (port) this.port = port;
    }


    static of(authority: ParsedAuthority | string): Authority {
        if (authority instanceof Authority) return authority;
        return typeof authority === 'string' ? Authority.parse(authority) : new Authority(authority);
    }

    private static readonly REGEX = /^(?:([^@]+)@)?(\[.+\]|[^:]+)(?:\:([\d]+))?$/;

    static parse(input: string): Authority {
        if (input === '') return Authority.of({host: ''});
        const match = Authority.REGEX.exec(input);
        if (!match) throw new Error(`Invalid Authority: ${input}`);
        const [, user, host, portString] = match;

        const port = portString ? Number.parseInt(portString) : undefined;
        if (typeof port !== 'undefined' && Number.isNaN(port)) throw new Error(`Invalid port '${portString}' in Authority: ${input}`);

        return Authority.of({user, host, port});
    }

    toString() {
        const result: string[] = [];

        if (typeof this.user != 'undefined') result.push(this.user, "@");
        if (typeof this.host != 'undefined') result.push(this.host);

        if (typeof this.port != 'undefined') result.push(":", this.port.toString());
        return result.join('');
    }

    toJSON() {
        return this.toString();
    }

}

export const leading = /^\/*/;
export const trailing = /\/*$/;

export function stripSlashes(path: string): string {
    return path
        .replace(leading, '')
        .replace(trailing, '');
}

export function joinPaths(...segments: string[]): string {
    return segments.reduce((acc, segment) => segment === '/'
        ? acc
        : `${acc}/${stripSlashes(segment)}`,
        "")
}
