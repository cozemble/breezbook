import {env, tenantId} from "$lib/uxs/personal-training/constants";

export function backendUrl(path: string): string {
    path = path.replace(/:envId/, env)
    path = path.replace(/:tenantId/, tenantId)
    return `http://localhost:3000${path}`;
}

export async function expectJson<T>(responseP: Promise<Response>): Promise<T> {
    const response = await responseP
    if (response.ok) {
        return response.json()
    } else {
        throw new Error(`Failed to fetch: ${response.statusText}`)
    }
}

export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
    const finalInit = {
        ...init,
        headers: {
            ...init.headers,
            'Content-Type': 'application/json'
        }
    }
    return expectJson<T>(fetch(url, finalInit))
}

