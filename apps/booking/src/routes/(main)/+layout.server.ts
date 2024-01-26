import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import api from '$lib/common/api';

export const load: LayoutServerLoad = async ({ params, url }) => {
	const doesSubdomainExist = url.host.split('.').length > 1;

	if (!doesSubdomainExist) redirect(307, '/listTenants'); // redirect to list of tenants for demo purposes

	const subdomain = url.host.split('.')[0];
	const isSubdomainWww = subdomain === 'www';

	if (isSubdomainWww) redirect(307, '/listTenants'); // redirect to list of tenants for demo purposes}

	const tenant = await api.tenant.getOne(subdomain);

	if (!tenant) error(404, 'Not found');

	return {
		tenant
	};
};
