import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

import backend from '$lib/common/backend';

export const load: LayoutServerLoad = async ({ params }) => {
	const tenant = await backend.tenant.getOne(params.tenant);

	if (!tenant) throw error(404, 'Not found');

	return {
		tenant
	};
};
