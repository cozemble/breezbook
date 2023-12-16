export function mandatory(value: any, errorMessage: string): any {
    if (!value) {
        throw new Error(errorMessage);
    }
    return value;
}
