export function makeTestId(tenantId: string, environmentId: string, id: string, delimiter = "_"): string {
    return [tenantId, environmentId, id].join(delimiter);
}