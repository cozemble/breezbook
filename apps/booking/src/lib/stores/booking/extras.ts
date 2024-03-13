import { derived, writable } from 'svelte/store';
import api from '$lib/common/api';
import tenantStore from '../tenant';

/** Setup stores to manage extras
 * - fetch extras initially
 */
export default function createExtrasStore(service: Service) {
	const tenant = tenantStore.get();

	const extras = writable<Service.Extra[]>([]);
	const loading = writable(false);
	/** Automatically derived from the extras with `selected: true` */
	const value = derived(extras, ($extras) => $extras.filter((extra) => extra.selected));

	const fetchExtras = async () => {
		loading.set(true);

		const res = await api.booking.getDetails(tenant.slug, service.slug);

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
