import api from '$lib/common/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const tenant = await parent().then((p) => p.tenant);

	const services = await api.service.getAll(tenant.slug);

	return {
		services
	};
};
