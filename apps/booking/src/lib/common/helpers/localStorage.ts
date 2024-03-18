import { onDestroy, onMount } from 'svelte';
import type { Unsubscriber } from 'svelte/motion';
import type { Writable } from 'svelte/store';

// * be careful to only operate on browser to prevent SSR issues
// TODO save to local storage on init
// TODO listen to changes and save to local storage
// TODO retrieve from local storage on mount

export const syncLocalStorage = <T extends Writable<V>, V>(key: string, store: T) => {
	const retrieveFromLocalStorage = () => {
		const val = localStorage.getItem(key);
		if (!val) return;

		store.set(JSON.parse(val));
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
