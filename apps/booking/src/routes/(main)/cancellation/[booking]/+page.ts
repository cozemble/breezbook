import api from '$lib/common/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent, params }) => {
	const tenant = await parent().then((p) => p.tenant);

	const bookingId = params.booking;

	const response = await api.booking.requestCancellationGrant(tenant.slug, bookingId).catch((e) => {
		error(e.response.status, e.response.data);
	});

	if (response._type !== 'cancellation.granted') {
		error(500, 'Cancellation grant request failed.');
	}

	return {
		cancellationGrant: response,
		bookingId
	};
};
