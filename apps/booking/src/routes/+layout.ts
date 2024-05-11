import posthog from 'posthog-js';
import { browser } from '$app/environment';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
	if (browser) {
		posthog.init('phc_asps2z1RUkEjKSSWV1ezUHyt2epCGGqDhLTejoYA2a7', {
			api_host: 'https://us.i.posthog.com'
		});
		console.log('Posthog initialized');

		Object.assign(window, { posthog });
	}
	return;
};
