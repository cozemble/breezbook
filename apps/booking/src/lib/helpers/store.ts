import { getContext, setContext } from 'svelte';

/** Create a context helper for a store. Store is created upon initialization.
 * - Use this to create a store that is set in the context
 * - Use `store.init()` to initialize the store in the root component
 * - Use `store.get()` to get the store from the context
 * - `key` is used to set the store in the context
 * - `createStore` is used to create the store when `init` is called
 */
export const createStoreContext = <TFunc extends (params?: any) => any>(
	key: string,
	createStore: TFunc
) => {
	type TParams = Parameters<TFunc>;
	type TReturn = ReturnType<TFunc>;

	/** Initialize the store and set it in the context
	 * - Call this in the root component of the others that will use the store
	 * - Can't be called more than once
	 * - `createStore` is used to create the store
	 * - `params` are passed to `createStore`
	 * - Returns the store
	 */
	const init = (...params: TParams) => {
		const existing = getContext<TFunc | null>(key);
		if (existing) throw new Error(`Store ${key.toString()} already initialized`);

		const store = createStore(...params);

		setContext(key, store);
		return store;
	};

	/** Get the store from the context
	 * - Call this in any component that needs access to the store
	 * - Make sure to call `store.init()` in the root component, otherwise this will throw
	 */
	const get = () => {
		const store = getContext<TReturn | null>(key);

		if (!store)
			throw new Error(
				`Store ${key.toString()} not initialized, use \`store.set\` to set it in the root component`
			);

		return store;
	};

	return {
		init,
		get
	};
};
