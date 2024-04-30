import { writable } from 'svelte/store';

import { createStoreContext } from '$lib/common/helpers/store';
import tenantStore from './tenant';
import { error } from '@sveltejs/kit';

const LOCATION_CTX_KEY = 'tenant-location';

const createLocationStore = (locationSlug: string) => {
	const tenant = tenantStore.get();

	if (!tenant) return null;

	const findLocation = (locationSlug: string) => {
		return tenant.locations.find((location) => location.slug === locationSlug);
	};

	const tenantLocation = findLocation(locationSlug);

	if (!tenantLocation) error(404, 'Location not found');

	return tenantLocation;
};

export const locationStore = createStoreContext(LOCATION_CTX_KEY, createLocationStore);
