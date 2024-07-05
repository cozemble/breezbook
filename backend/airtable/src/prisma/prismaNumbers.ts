export function toNumber(value: any): number {
    return (typeof value === "object" && "toNumber" in value) ? value.toNumber() : value;
}