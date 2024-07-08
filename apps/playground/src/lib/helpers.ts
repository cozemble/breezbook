import {env, tenantId} from "$lib/uxs/personal-training/constants";

export function backendUrl(path: string): string {
    path = path.replace(/:envId/, env);
    path = path.replace(/:tenantId/, tenantId);

    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const baseUrl = isHttps
        ? 'https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app'
        : 'http://localhost:3000';

    return `${baseUrl}${path}`;
}

export async function expectJson<T>(responseP: Promise<Response>): Promise<T> {
    const response = await responseP
    if (response.ok) {
        return response.json()
    } else {
        const text = await response.text()
        throw new Error(`Failed to fetch: ${response.statusText}. ${text}`)
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

