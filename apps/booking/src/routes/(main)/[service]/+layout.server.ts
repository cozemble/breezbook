import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import api from '$lib/common/api';

export const load: LayoutServerLoad = async ({ params, parent }) => {
	const tenantSlug = await parent().then((p) => p.tenant.slug);
	const service = await api.service.getOne(tenantSlug, params.service);

	if (!service) throw error(404, 'Not found');

	return {
		service
	};
};
