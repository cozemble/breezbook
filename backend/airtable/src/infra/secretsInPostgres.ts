import { mandatory, TenantEnvironment } from '@breezbook/packages-core';
import { prismaClient } from '../prisma/client.js';

export async function storeSecret(
	tenantEnvironment: TenantEnvironment,
	secretShortName: string,
	secretDescription: string,
	secretValue: string
): Promise<void> {
	const prisma = prismaClient();
	const encryptionKey = mandatory(process.env.SECRETS_ENCRYPTION_KEY, `No SECRETS_ENCRYPTION_KEY env variable`);
	const result =
		await prisma.$executeRaw`SELECT bb_upsert_tenant_secret(${tenantEnvironment.tenantId.value}, ${tenantEnvironment.environmentId.value}, ${secretShortName}, ${secretDescription}, ${secretValue}, ${encryptionKey})`;
	if (result === null) {
		throw new Error(
			`Failed to store secret ${secretShortName} for tenant ${tenantEnvironment.tenantId.value} and environment ${tenantEnvironment.environmentId.value}`
		);
	}
}

interface QueryResult {
	bb_get_tenant_secret: string;
}

export async function getSecret(tenantEnvironment: TenantEnvironment, secretShortName: string): Promise<string> {
	const prisma = prismaClient();
	const encryptionKey = mandatory(process.env.SECRETS_ENCRYPTION_KEY, `No SECRETS_ENCRYPTION_KEY env variable`);
	const result = await prisma.$queryRaw<
		QueryResult[]
	>`SELECT bb_get_tenant_secret(${tenantEnvironment.tenantId.value}, ${tenantEnvironment.environmentId.value}, ${secretShortName}, ${encryptionKey})`;
	if (result === null) {
		throw new Error(
			`Failed to get secret ${secretShortName} for tenant ${tenantEnvironment.tenantId.value} and environment ${tenantEnvironment.environmentId.value}`
		);
	}
	return result[0].bb_get_tenant_secret;
}
