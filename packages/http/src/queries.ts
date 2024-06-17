import {DecodedPair, decodePairs, encodePairs} from "./urlEncoding.js";

/**
 * If there are multiple values for the same name in the query string, value will be an array
 */
export type QueryValue = (string | undefined)[] | string | undefined;
export type QueryPair = [string, QueryValue];

/**
 * Takes a list of pairs where the value might be an array, and returns a list of simple name-value pairs,
 * with one pair for each value in the QueryPair.
 *
 * `expand(["names", ["tom", "matt"]])` returns `[["names", "tom"], ["names", "matt"]]`
 */
export function expand([name, value]: QueryPair): DecodedPair[] {
    return Array.isArray(value)
        ? value.map(value => [name, value])
        : [[name, value]];
}

export function appendQuery(query: string | undefined, name: string, value: QueryValue): string {
    const newQuery = encodePairs(expand([name, value]));
    if (typeof query === 'undefined' || query.length === 0) return newQuery as string;
    return `${query}&${newQuery}`
}

export function appendQueries(
    query: string | undefined,
    queries: { [key: string]: QueryValue }): string | undefined {

    return Object.entries(queries).reduce((acc, [name, value]) => {
        return appendQuery(acc, name, value)
    }, query)
}

export function removeQuery(query: string | undefined, name: string): string | undefined {
    const filtered = decodePairs(query).filter(([n]) => n !== name);
    return encodePairs(filtered)
}

export function removeQueries(query: string | undefined, ...names: string[]): string | undefined {
    return names.reduce((result, name) => removeQuery(result, name), query)
}

export function setQuery(query: string | undefined, name: string, value: QueryValue): string {
    return appendQuery(removeQuery(query, name), name, value);
}

export function setQueries(query: string | undefined, queries: { [key: string]: QueryValue }): string | undefined {
    const existingKeys = new Set(Object.keys(queries));
    const filtered = decodePairs(query)
        .filter(([name]) => !existingKeys.has(name));
    return appendQueries(encodePairs(filtered), queries);
}

export function query(query: string | undefined, name: string): string | undefined {
    return decodePairs(query).find(([n]) => n === name)?.[1];
}

export function queries(query: string | undefined, name: string): (string | undefined)[] {
    return decodePairs(query).filter(([n]) => n === name).map(([_, v]) => v);
}
