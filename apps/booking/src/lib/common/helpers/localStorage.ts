import { onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/motion';
import { get, type Writable } from 'svelte/store';
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
		const localJson = localStorage.getItem(key);
		console.log(`${key} - localJson`, localJson);
		if (!localJson) return;

		const localVal = JSON.parse(localJson);
		console.log(`${key} - localVal`, localVal);

		const val = _.cloneDeep(get(store));

		if (_.isArray(val)) {
			if (!_.isArray(localVal))
				throw new Error(
					`localStorage value for key "${key}" is not an array, but the store is an array.`,
					localVal
				);

			const merged = _.concat(val, localVal) as V;
			store.set(merged);
			console.log(`${key} - merged`, merged);
			return;
		}

		if (_.isObject(val)) {
			if (!_.isObject(localVal))
				throw new Error(
					`localStorage value for key "${key}" is not an object, but the store is an object.`,
					localVal
				);

			store.set(_.merge(val, localVal));
			return;
		}

		if (!val) store.set(localVal);
	};

	const saveToLocalStorage = (item: V) => {
		console.log(`${key} - saveToLocalStorage`, item);

		if (!item) localStorage.removeItem(key); // remove the key if the value is null

		localStorage.setItem(key, JSON.stringify(item));
	};

	/** Prevent memory leaks */
	let unsubscriber: Unsubscriber | undefined;

	onMount(() => {
		retrieveFromLocalStorage();

		unsubscriber?.();
		unsubscriber = store.subscribe(saveToLocalStorage);
	});

	onDestroy(() => {
		unsubscriber?.();
	});
};
