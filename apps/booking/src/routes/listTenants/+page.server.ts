import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import * as utils from '$lib/common/utils';

export const load: PageServerLoad = async ({ url }) => {
	const subdomain = utils.link.getSubdomain(url);

	const isSubdomainWww = subdomain === 'www';

	// don't allow to access this page on subdomains except "www"
	if (subdomain && !isSubdomainWww)
		error(403, 'This page is not accessible on tenant subdomains, visit the root domain instead');
};
