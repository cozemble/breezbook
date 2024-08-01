import { createStoreContext } from '$lib/common/helpers/store';
import type {Tenant} from "@breezbook/backend-api-types";

const TENANT_CTX_KEY = 'tenant';

// TODO fully functional store when needed
const createTenantStore = (tenant: Tenant) => {
	return tenant;
};

const tenantStore = createStoreContext(TENANT_CTX_KEY, createTenantStore);

export default tenantStore;
