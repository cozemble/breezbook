import { createStoreContext } from '$lib/common/helpers/store';

const LOCATION_CTX_KEY = 'tenant-location';

const createLocationStore = (location: TenantLocation) => {
	return location;
};

export const locationStore = createStoreContext(LOCATION_CTX_KEY, createLocationStore);
