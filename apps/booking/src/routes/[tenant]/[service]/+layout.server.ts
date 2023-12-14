import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import backend from '$lib/common/backend';

export const load: LayoutServerLoad = async ({ params }) => {
	const service = await backend.service.getOne(params.tenant, params.service);

	if (!service) throw error(404, 'Not found');

	return {
		service
	};
};
