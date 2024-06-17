export type DecodedPair = [string, string | undefined];

export function decode(value: string): string {
    return decodeURIComponent(value.replace('+', ' '));
}

export function encode(value: string): string {
    return encodeURIComponent(value).replace('%20', '+');
}

export function decodePair(pair: string): DecodedPair {
    const [name, value] = pair.split('=');
    const decoded = pair.indexOf('=') < 0 ? undefined : decode(value);
    return [decode(name), decoded]
}

export function decodePairs(value: string | undefined): DecodedPair[] {
    if (typeof value === "undefined") return [];
    return value
        .split('&')
        .map(p => decodePair(p));
}

export function encodePair([name, value]: DecodedPair): string {
    const encodedValue = value === undefined
        ? ""
        : `=${encode(value)}`;

    return `${encode(name)}${encodedValue}`
}

export function encodePairs(values: DecodedPair[]): string | undefined {
    if (values.length == 0) return undefined;
    return values
        .map(encodePair)
        .join('&');
}