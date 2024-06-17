import {ParsedUri} from "./contract.js";

export interface Closeable<T = unknown> {
    close(): Promise<T>
}

export interface Server extends Closeable {
    url(): Promise<ParsedUri>
}
