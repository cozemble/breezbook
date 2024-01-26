import { getContext, setContext } from 'svelte';

const TENANT_CTX_KEY = Symbol('tenant');

/** Store the tenant as Svelte context */
export const tenantStore = {
	/** Set the tenant in the context
	 * - Call this in the root layout component
	 */
	set: (value: Tenant) => {
		setContext(TENANT_CTX_KEY, value);
	},

	/** Get the tenant from the context
	 * - Throws if the tenant is not set
	 * - Call this in any component that needs the tenant
	 */
	get: () => {
		const tenant = getContext<Tenant>(TENANT_CTX_KEY);

		if (!tenant)
			throw new Error('Tenant not set, use `tenant.set` to set it in the root component');

		return tenant;
	}
};
