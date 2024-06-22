export function mandatory<T>(value: T | undefined | null, errorMessage: string): T {
    if (value === null || value === undefined) {
        throw new Error(errorMessage);
    }
    return value as T;
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

export interface Failure<T = unknown> {
    _type: 'failure';
    value: T;
}

export function failure<T>(value: T): Failure<T> {
    return {_type: 'failure', value};
}

export interface ErrorResponse<V = any> {
    _type: 'error.response';
    errorCode: string;
    errorMessage?: string;
    errorData?: V
}

export function isErrorResponse<V = any>(variableToCheck: any): variableToCheck is ErrorResponse<V> {
    return variableToCheck._type === 'error.response';
}



export function errorResponse<V = any>(errorCode: string, errorMessage?: string, errorData?: V): ErrorResponse {
    return {_type: 'error.response', errorCode, errorMessage, errorData};
}


export const errorResponseFns = {
    toError: (response: ErrorResponse): Error => {
        return new Error(`${response.errorCode}: ${response.errorMessage ?? ''}`);
    },
    prependMessage<T>(s: string, resourceOutcome: ErrorResponse<T>):ErrorResponse<T> {
        return errorResponse<T>(resourceOutcome.errorCode, `${s}: ${resourceOutcome.errorMessage}`, resourceOutcome.errorData);
    },
    arrayOrError<T,E>(lines: (ErrorResponse<E> | T)[]):T[]|ErrorResponse<E> {
        const firstError = lines.find(isErrorResponse);
        if (firstError) {
            return firstError;
        }
        return lines as T[];
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