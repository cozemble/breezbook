import { derived, writable, type Writable } from 'svelte/store';
import type { AvailabilityResponse } from '@breezbook/backend-api-types';

/** Setup stores to manage extras
 * - fetch extras initially
 */
export default function createExtrasStore(
	availabilityResponseStore: Writable<AvailabilityResponse | null>
) {
	const extras = writable<Service.Extra[]>([]);
	const loading = writable(true);

	availabilityResponseStore.subscribe((availabilityResponse) => {
		if (!availabilityResponse) {
			loading.set(true);
			return;
		}

		const xtr = availabilityResponse.addOns.map(
			(addOn): Service.Extra => ({
				id: addOn.id,
				name: addOn.name,
				price: Number(addOn.priceWithNoDecimalPlaces),
				description: addOn?.description || undefined,
				selected: false
			})
		);
		extras.set(xtr);
		loading.set(false);
	});

	/** Automatically derived from the extras with `selected: true` */
	const value = derived(extras, ($extras) => $extras.filter((extra) => extra.selected));

	return {
		extras,
		loading,
		value
	};
}
