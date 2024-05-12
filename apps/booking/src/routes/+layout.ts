import posthog from 'posthog-js';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';

import api from '$lib/common/api';
import * as utils from '$lib/common/utils';
import { error, redirect } from '@sveltejs/kit';

export const load: LayoutLoad = async ({ params, url }) => {
	if (browser) {
		// Posthog tracking
		posthog.init('phc_asps2z1RUkEjKSSWV1ezUHyt2epCGGqDhLTejoYA2a7', {
			api_host: 'https://us.i.posthog.com'
		});
	}

	const subdomain = utils.link.getSubdomain(url);
	const isSubdomainWww = subdomain === 'www';
	if (!subdomain || isSubdomainWww) redirect(307, 'https://breezbook.com'); // redirect to list of tenants for demo purposes}

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
