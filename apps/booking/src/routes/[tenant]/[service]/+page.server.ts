import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	if (params.service === 'car-wash') {
		return { title: 'Hey!', content: "Welcome To Mike's Car Wash!" };
	}

	throw error(404, 'Not found');
};
