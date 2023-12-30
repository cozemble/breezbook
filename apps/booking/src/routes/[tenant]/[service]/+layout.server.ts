import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import api from '$lib/common/api';

export const load: LayoutServerLoad = async ({ params }) => {
	const service = await api.service.getOne(params.tenant, params.service);

	if (!service) throw error(404, 'Not found');

	return {
		service
	};
};
