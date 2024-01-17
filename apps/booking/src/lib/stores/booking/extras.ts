import { writable } from 'svelte/store';
import api from '$lib/common/api';

/** Setup stores to manage extras
 * - fetch extras initially
 */
export function initExtras(service: Service) {
	const extras = writable<Service.Extra[]>([]);
	const loading = writable(false);
	const value = writable<Service.Extra[]>([]);

	const fetchExtras = async () => {
		loading.set(true);

		const res = await api.extras.getAll('', ''); // TODO proper params
		extras.set(res);

		loading.set(false);
	};

	// fetch time slots initially
	fetchExtras();

	return {
		extras,
		loading,
		value
	};
}
