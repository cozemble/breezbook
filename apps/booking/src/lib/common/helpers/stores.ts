import { onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/motion';
import { get, writable } from 'svelte/store';
import _ from 'lodash';
import { browser } from '$app/environment';

/** Create an automatically synchronized Svelte store with localStorage for persistence
 * - get the data from localStorage onMount
 * 	   - if the store is a simple one and already has a value, do nothing
 * 		 - if the store is an array, merge the localStorage value into the store
 *     - if the store is an object, merge the localStorage value into the store
 * - save the data to localStorage on store change
 */
export const localSyncedStore = <T>(key: string, initialValue: T) => {
	const getLocalValue = (): T | null => {
		if (!browser) return null; // prevent SSR issues

		const localJson = localStorage.getItem(key);
		console.log(`${key} - localJson`, localJson);
		if (!localJson) return null;

		const localVal = JSON.parse(localJson) as T;
		console.log(`${key} - localVal`, localVal);

		return localVal;
	};

	const saveToLocalStorage = (val: T) => {
		console.log(`${key} - saveToLocalStorage`, val);

		localStorage.setItem(key, JSON.stringify(val));
	};

	//

	const localVal = getLocalValue();
	const store = writable<T>(localVal ?? initialValue);

	/** Prevent memory leaks */
	let unsubscriber: Unsubscriber | undefined;

	onMount(() => {
		unsubscriber?.();
		unsubscriber = store.subscribe(saveToLocalStorage);
	});

	onDestroy(() => {
		unsubscriber?.();
	});

	return {
		...store,
		get: () => get(store)
	};
};
