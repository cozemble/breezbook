import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import api from '$lib/common/api';
import * as utils from '$lib/utils';

export const load: LayoutServerLoad = async ({ params, url }) => {
	const subdomain = utils.link.getSubdomain(url);
	if (!subdomain) redirect(307, '/listTenants'); // redirect to list of tenants for demo purposes

	const isSubdomainWww = subdomain === 'www';
	if (isSubdomainWww) redirect(307, '/listTenants'); // redirect to list of tenants for demo purposes}

	const tenant = await api.tenant.getOne(subdomain);
	if (!tenant) error(404, 'Tenant not found');

	return {
		tenant
	};
};
