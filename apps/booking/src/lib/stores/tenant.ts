import { getContext, setContext } from 'svelte';

const TENANT_CTX_KEY = Symbol('tenant');

/** Store the tenant as Svelte context */
export const tenantStore = {
	set: (value: Tenant) => {
		setContext(TENANT_CTX_KEY, value);
	},
	/** Set the tenant in +layout.svelte to make it available in all components */
	get: () => {
		const tenant = getContext<Tenant>(TENANT_CTX_KEY);

		if (!tenant)
			throw new Error('Tenant not set, use `tenant.set` to set it in the root component');

		return tenant;
	}
};
