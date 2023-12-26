export function mandatory<T>(value: T|undefined, errorMessage: string): T {
    if (!value) {
        throw new Error(errorMessage);
    }
    return value;
}
