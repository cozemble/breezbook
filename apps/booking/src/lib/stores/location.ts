import { createStoreContext } from '$lib/common/helpers/store';
import type { Location } from '@breezbook/backend-api-types';

const LOCATION_CTX_KEY = 'tenant-location';

const createLocationStore = (location: Location) => {
	return location;
};

export const locationStore = createStoreContext(LOCATION_CTX_KEY, createLocationStore);
