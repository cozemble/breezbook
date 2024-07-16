import { derived, writable, type Writable } from 'svelte/store';
import {type AddOnSummary, type AvailabilityResponse, type Tenant} from '@breezbook/backend-api-types';

/** Setup stores to manage extras
 * - fetch extras initially
 */
export default function createExtrasStore(
	availabilityResponseStore: Writable<AvailabilityResponse | null>, tenant:Tenant
) {
	const extras = writable<Service.Extra[]>([]);
	const loading = writable(true);

	availabilityResponseStore.subscribe((availabilityResponse) => {
		if (!availabilityResponse) {
			loading.set(true);
			return;
		}
		const service = tenant.services.find((service) => service.id === availabilityResponse.serviceId);
		const addOns = service?.addOns ?? [] as AddOnSummary[]


		const xtr = addOns.map(
			(addOn): Service.Extra => ({
				id: addOn.id,
				name: addOn?.labels?.name || "Missing name",
				price: Number(addOn.priceWithNoDecimalPlaces),
				description: addOn?.labels?.description || undefined,
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
