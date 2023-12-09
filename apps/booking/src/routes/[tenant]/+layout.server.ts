import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	if (params.tenant === 'mike') {
		return {
			status: 200,
			error: null
		};
	}

	return {
		status: 404,
		error: new Error('Not found')
	};
};
