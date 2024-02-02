import { writable } from 'svelte/store';
import api from '$lib/common/api';

/** Setup stores to manage extras
 * - fetch extras initially
 */
export default function createExtrasStore(service: Service) {
	const extras = writable<Service.Extra[]>([]);
	const loading = writable(false);
	const value = writable<Service.Extra[]>([]);

	const fetchExtras = async () => {
		loading.set(true);

		const res = await api.service.getDetails('', ''); // TODO proper params

		const addOns = res.addOns.map(
			(addOn): Service.Extra => ({
				id: addOn.id,
				name: addOn.name,
				price: Number(addOn.priceWithNoDecimalPlaces),
				description: addOn?.description || undefined,
				selected: false
			})
		);
		extras.set(addOns);

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
