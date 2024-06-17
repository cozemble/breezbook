export function modify<T extends object>(value: T, modifications: Partial<T>): T {
    return Object.assign({}, value, modifications);
}