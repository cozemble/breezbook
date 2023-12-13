import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import backend from '$lib/common/backend';

export const load: PageServerLoad = async ({ params }) => {
	const service = await backend.service.getOne(params.tenant, params.service);

	if (!service) throw error(404, 'Not found');

	return {
		service
	};
};
