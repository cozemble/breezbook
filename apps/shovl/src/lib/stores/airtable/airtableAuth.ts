import { writable } from 'svelte/store';

export const airtableAccessToken = writable<string | null>(null);
