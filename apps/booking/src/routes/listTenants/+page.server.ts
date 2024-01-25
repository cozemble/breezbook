import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const doesSubdomainExist = url.host.split('.').length > 1;

	// don't allow to access this page on subdomains
	if (doesSubdomainExist)
		throw error(403, 'This page is not accessible on subdomains, visit the root domain instead');
};
