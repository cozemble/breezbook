export function mandatory<T>(value: T | undefined, errorMessage: string): Exclude<T | undefined | null, undefined | null> {
    if (!value) {
        throw new Error(errorMessage);
    }
    return value as Exclude<T | undefined | null, undefined | null>;
}

export function randomInteger(max: number, min = 0): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export interface Success<T = unknown> {
    _type: 'success';
    value: T;
}

export function success<T>(value: T): Success<T> {
    return {_type: 'success', value};
}

export interface ErrorResponse<V = any> {
    _type: 'error.response';
    errorCode: string;
    errorMessage?: string;
    errorData?: V
}

export function errorResponse<V = any>(errorCode: string, errorMessage?: string, errorData?: V): ErrorResponse {
    return {_type: 'error.response', errorCode, errorMessage, errorData};
}

export const errorResponseFns = {
    toError: (response: ErrorResponse): Error => {
        return new Error(`${response.errorCode}: ${response.errorMessage ?? ''}`);
    }
}


export function omit<Data extends object, Keys extends keyof Data>(
    data: Data,
    keys: Keys[]
): Omit<Data, Keys> {
    const result = {...data};
    for (const key of keys) {
        delete result[key];
    }
    return result as Omit<Data, Keys>;
}

export function stableJson(data: any): string {
    return JSON.stringify(data, Object.keys(data).sort());
}