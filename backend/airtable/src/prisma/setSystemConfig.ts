import { TenantEnvironment } from '@breezbook/packages-core';
import { prismaClient } from './client.js';

export async function setSystemConfig(tenantEnv: TenantEnvironment, configKey: string, configValue: string): Promise<void> {
	const prisma = prismaClient();
	await prisma.system_config.create({
		data: { environment_id: tenantEnv.environmentId.value, config_key: configKey, config_value: configValue }
	});
}
