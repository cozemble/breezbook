import { getContext, setContext } from 'svelte';
import { writable } from 'svelte/store';

const CART_STORE_CONTEXT_KEY = Symbol('cart_store');

export function createCartStore() {
	const items = writable<Booking[]>([
		// TODO remove mock
		{
			calculatedPrice: 24000,
			details: {},
			extras: [{ name: 'mock-extra' }] as Service.Extra[],
			id: 'mock-1',
			service: {
				id: 'mock-1',
				name: 'Toy Doll Execution',
				image: 'https://picsum.photos/203',
				slug: 'mock-service'
			} as unknown as Service,
			time: {
				day: new Date(),
				start: '10:00',
				end: '12:00',
				price: 24000
			}
		},
		{
			calculatedPrice: 55000,
			details: {},
			extras: [],
			id: 'mock-2',
			service: {
				id: 'mock-2',
				image: 'https://picsum.photos/201',
				name: 'Exorcism of A Demonic Spirit',
				slug: 'mock-service'
			} as unknown as Service,
			time: {
				day: new Date(),
				start: '09:00',
				end: '11:00',
				price: 24000
			}
		},
		{
			calculatedPrice: 12000,
			details: {},
			extras: [],
			id: 'mock-3',
			service: {
				id: 'mock-3',
				image: 'https://picsum.photos/200',
				name: 'Watching Tom & Jerry With You',
				slug: 'mock-service'
			} as unknown as Service,
			time: {
				day: new Date(),
				start: '12:00',
				end: '14:00',
				price: 24000
			}
		},
		{
			calculatedPrice: 720000,
			details: {},
			extras: [{ name: 'mock-extra' }, { name: 'extra-mock-2' }] as Service.Extra[],
			id: 'mock-4',
			service: {
				id: 'mock-4',
				image: 'https://picsum.photos/204',
				name: 'Wedding Prank',
				slug: 'mock-service'
			} as unknown as Service,
			time: {
				day: new Date(),
				start: '17:00',
				end: '23:00',
				price: 24000
			}
		}
	]);

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
