import api from '$lib/common/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent, params }) => {
	const tenant = await parent().then((p) => p.tenant);

	const bookingId = params.booking;

	const response = await api.booking.requestCancellationGrant(tenant.slug, bookingId);

	return {
		cancellationGrant: response,
		bookingId
	};
};
