import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, url, parent }) => {
	const tenant = await parent().then((parent) => parent.tenant);

	const locationSlug = params.location;

	const tenantLocation = tenant.locations.find((location) => location.slug === locationSlug);

	if (!tenantLocation) error(404, 'Location not found');

	return {
		location: tenantLocation
	};
};
