import { onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/motion';
import type { Writable } from 'svelte/store';
import _ from 'lodash';
import { browser } from '$app/environment';

/** Automatically synchronize a Svelte store with localStorage for persistence
 * - get the data from localStorage onMount
 * 	   - if the store is a simple one and already has a value, do nothing
 * 		 - if the store is an array, merge the localStorage value into the store
 *     - if the store is an object, merge the localStorage value into the store
 * - save the data to localStorage on store change
 */
export const syncLocalStorage = <T extends Writable<V>, V>(key: string, store: T) => {
	if (!browser) return; // * prevent SSR issues

	const retrieveFromLocalStorage = () => {
		const local = localStorage.getItem(key);
		if (!local) return;

		store.update((val) => {
			if (_.isArray(val)) return val.push(JSON.parse(local));
			if (_.isObject(val)) return _.merge(val, JSON.parse(local));
			return val || JSON.parse(local);
		});
	};

	const saveToLocalStorage = (item: V) => {
		localStorage.setItem(key, JSON.stringify(item));
	};

	/** Prevent memory leaks */
	let unsubscriber: Unsubscriber | undefined;

	onMount(() => {
		retrieveFromLocalStorage();

		unsubscriber?.();
		unsubscriber = store.subscribe((value) => {
			saveToLocalStorage(value);
		});
	});

	onDestroy(() => {
		unsubscriber?.();
	});
};
