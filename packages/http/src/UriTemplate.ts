import {Regex} from "./util/regex.js";
import {Uri} from "./uri.js";

export type UriTemplateCaptures = {
    query: Captures;
    path: Captures;
}
type Captures = { [name: string]: string | string[] }

export class UriTemplate {
    private pathVariableValuesCapturingRegexp: Regex;

    constructor(private template: string) {
        this.pathVariableValuesCapturingRegexp = new Regex(`^${this.pathVariableCapturingTemplate()}$`);
    }

    static of(template: string) {
        return new UriTemplate(template)
    }

    matches(uri: Uri | string): boolean {
        const pathNoTrailingSlash = Uri.of(uri).path.replace(/\/$/g, '');
        return this.pathVariableValuesCapturingRegexp.match(pathNoTrailingSlash) !== null
    }

    extract(uri: Uri | string): UriTemplateCaptures {
        return {
            query: this.extractQueryCaptures(uri),
            path: this.extractPathCaptures(Uri.of(uri).path.replace(/\/$/g, ''))
        }
    }

    expand(captures: UriTemplateCaptures): string {
        return Object.keys(captures.path).reduce((uri, captureName) => {
            return uri.replace(`{${captureName}}`, encodeURIComponent(captures.path[captureName] as string));
        }, this.template)
    }

    private extractPathCaptures(path: string): Captures {
        const pathVariableNames = (this.template.match(/{[^:}]+/g) || []).map(name => name.replace('{', ''));
        const values = this.pathVariableValuesCapturingRegexp.match(path);

        return pathVariableNames.reduce((captures: Captures, pathParam: string, index: number) => {
            if (values && values[index + 1]) captures[pathParam] = decodeURIComponent(values[index + 1]);
            return captures;
        }, {});
    }

    private extractQueryCaptures(uri: Uri | string): Captures {
        const query = Uri.of(uri).query;
        if (!query) return {};
        return (query).split('&').reduce((capture: Captures, query: string) => {
            const [key, value] = query.split('=');
            if (capture[key]) {
                if (typeof capture[key] === 'string') {
                    capture[key] = [capture[key] as string, decodeURIComponent(value)];
                } else {
                    (capture[key] as string[]).push(decodeURIComponent(value))
                }
            } else {
                capture[key] = decodeURIComponent(value);
            }
            return capture;
        }, {});
    }

    private pathVariableCapturingTemplate(): string {
        const templateNoTrailingSlash = this.template.replace(/\/$/g, '');
        const templateRewritingRegex = new Regex('{([^}]+?)(?::([^}]+))?}');
        const matches = Array.from(templateRewritingRegex.matches(templateNoTrailingSlash));

        return matches.reduce((pathVariableCapturingTemplate: string, match: RegExpMatchArray | null) => {
            const regexCapture = match && match[2];
            return pathVariableCapturingTemplate.replace(/{[^}]+}/, regexCapture ? `(${match![2]})` : '([^\/]+?)');
        }, templateNoTrailingSlash);
    }
}

export function uriTemplate(template: string): UriTemplate {
    return new UriTemplate(template)
}

