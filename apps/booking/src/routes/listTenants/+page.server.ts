import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const doesSubdomainExist = url.host.split('.').length > 1;
	const subdomain = url.host.split('.')[0];

	const isSubdomainWww = subdomain === 'www';

	// don't allow to access this page on subdomains except "www"
	if (doesSubdomainExist && !isSubdomainWww)
		error(
        			403,
        			'This page is not accessible on tenant subdomains, visit the root domain instead'
        		);
};
