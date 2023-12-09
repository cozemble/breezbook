import mock from '$lib/mock';

// TODO: replace with real fetch

export const tenant = {
	getOne: async (slug: string) => {
		const tenant = mock.tenants.find((tenant) => tenant.slug === slug);

		return tenant || null;
	},
	getAll: async () => {
		return mock.tenants;
	}
};

export default {
	tenant
};
