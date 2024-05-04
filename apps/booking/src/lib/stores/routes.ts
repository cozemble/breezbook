import { createStoreContext } from '$lib/common/helpers/store';
import * as utils from '$lib/common/utils';

import { locationStore } from './location';

const createRouteStore = () => {
	const location = locationStore.get();

	return {
		home: () => `/${location.slug}`,
		servicesList: () => `/${location.slug}#services`,
		contact: () => `/${location.slug}#contact`,
		service: (serviceSlug: string) => `/${location.slug}/${serviceSlug}`,
		booking: (serviceSlug: string) => `/${location.slug}/${serviceSlug}/booking`,
		checkout: {
			main: () => `/${location.slug}/checkout`,
			details: () => `/${location.slug}/checkout/details`,
			payment: () => `/${location.slug}/checkout/payment`,
			success: () => `/${location.slug}/checkout/success`
		},
		breezbook: () => 'https://breezbook.com/'
	};
};

export const routeStore = createStoreContext('app-routes', createRouteStore);
export default routeStore;
