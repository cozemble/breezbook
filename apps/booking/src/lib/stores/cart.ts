import { onMount } from 'svelte';
import { writable } from 'svelte/store';
import { createStoreContext } from '$lib/helpers/store';

const CART_STORE_CONTEXT_KEY = 'cart_store';

// TODO refactor this

const getFromLocalStorage = () => {
	const items = localStorage.getItem(CART_STORE_CONTEXT_KEY);
	if (!items) return [];

	return JSON.parse(items) as Booking[];
};

const saveToLocalStorage = (items: Booking[]) => {
	localStorage.setItem(CART_STORE_CONTEXT_KEY, JSON.stringify(items));
};

//

export function createCartStore() {
	const items = writable<Booking[]>([]);

	const addItem = (item: Omit<Booking, 'id'>) => {
		const newItem = {
			...item,
			id: Math.random().toString(36).substring(2, 9)
		};
		console.log(newItem);
		items.update((prev) => [...prev, newItem]);
		return newItem;
	};

	const removeItem = (itemId: string) =>
		items.update((prev) => prev.filter((i) => i.id !== itemId));

	const clearItems = () => {
		items.set([]);
	};

	// doing this on mount otherwise SSR will fail
	onMount(() => {
		items.set(getFromLocalStorage());
		items.subscribe((value) => saveToLocalStorage(value));
	});

	return {
		items,
		addItem,
		removeItem,
		clearItems
	};
}

//

export const cartStore = createStoreContext(CART_STORE_CONTEXT_KEY, createCartStore);
