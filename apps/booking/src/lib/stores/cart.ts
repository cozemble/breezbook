import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';

const CART_STORE_CONTEXT_KEY = Symbol('cart_store');

export function createCartStore() {
	const items = writable<Booking[]>([]);

	const addItem = (item: Omit<Booking, 'id'>) => {
		const id = Math.random().toString(36).substring(2, 9);

		const newItem = {
			...item,
			id
		};

		items.update((prev) => [...prev, newItem]);

		return newItem;
	};

	const removeItem = (itemId: string) =>
		items.update((prev) => prev.filter((i) => i.id !== itemId));

	const clearItems = () => {
		items.set([]);
	};

	return {
		items,
		addItem,
		removeItem,
		clearItems
	};
}

type CartStore = ReturnType<typeof createCartStore>;

export const initCartStore = () => {
	const store = createCartStore();
	setContext(CART_STORE_CONTEXT_KEY, store);

	return store;
};

export const getCartStore = () => {
	const store = getContext<CartStore | null>(CART_STORE_CONTEXT_KEY);
	if (!store)
		throw new Error(
			'Cart store not initialized, initialize with initCartStore() in the root layout'
		);

	return store;
};