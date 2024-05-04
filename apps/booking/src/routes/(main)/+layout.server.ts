import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import api from '$lib/common/api';
import * as utils from '$lib/common/utils';

/** Handle fetching of the tenant information and location
 * - Redirect to list of tenants if no subdomain is provided
 * - Redirect to first location if no location is provided
 * - Return the tenant and location
 */
export const load: LayoutServerLoad = async ({ params, url }) => {
	const subdomain = utils.link.getSubdomain(url);
	const isSubdomainWww = subdomain === 'www';
	if (!subdomain || isSubdomainWww) redirect(307, '/listTenants'); // redirect to list of tenants for demo purposes}

	const tenant = await api.tenant.getOne(subdomain);
	if (!tenant) error(404, 'Tenant not found');

	const locationSlug = params.location;
	// default to first location if no location is provided
	if (!locationSlug) {
		console.log('redirecting to first location');
		redirect(307, `/${tenant.locations[0].slug}`);
	}

	const location = tenant.locations.find((location) => location.slug === locationSlug);
	if (!location) error(404, 'Location not found');

	return {
		tenant,
		location
	};
};
