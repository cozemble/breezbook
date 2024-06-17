export function assertExhaustive(
    value: never,
    message: string = 'Reached unexpected case in exhaustive switch'
): never {
    throw new Error(`${message}\n because of value: ${value}`);
}