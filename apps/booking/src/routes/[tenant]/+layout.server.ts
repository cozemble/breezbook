import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import api from '$lib/common/api';

export const load: LayoutServerLoad = async ({ params }) => {
	const tenant = await api.tenant.getOne(params.tenant);

	if (!tenant) throw error(404, 'Not found');

	const services = await api.service.getAll(params.tenant);

	return {
		tenant,
		services
	};
};
