import mock, { services } from '$lib/mock';

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

export const service = {
	getOne: async (tenantSlug: string, serviceSlug: string) => {
		const tenant = await backend.tenant.getOne(tenantSlug);
		if (!tenant) return null;

		const service = services.find((service) => service.slug === serviceSlug);
		return service || null;
	},

	getAll: async (tenantSlug: string) => {
		const tenant = await backend.tenant.getOne(tenantSlug);
		if (!tenant) return null;

		const tenantServices = services.filter((service) => service.tenantId === tenant.id);
		return tenantServices || null;
	}
};

const backend = {
	tenant,
	service
};

export default backend;
