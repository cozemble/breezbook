import { EnvironmentId, TenantEnvironment } from '@breezbook/packages-core';
import { prismaClient } from '../prisma/client.js';

export async function storeTenantSecret(
	tenantEnvironment: TenantEnvironment,
	secretShortName: string,
	secretDescription: string,
	secretValue: string
): Promise<void> {
	return storeSecret(secretValue, tenantSecretName(tenantEnvironment, secretShortName), secretDescription);
}

export async function storeSystemSecret(environmentId: EnvironmentId, secretShortName: string, secretDescription: string, secretValue: string): Promise<void> {
	return storeSecret(secretValue, systemSecretName(environmentId, secretShortName), secretDescription);
}

export async function getTenantSecret(tenantEnvironment: TenantEnvironment, secretShortName: string): Promise<string> {
	return getSecretValue(tenantSecretName(tenantEnvironment, secretShortName));
}

interface QueryResult {
	decrypted_secret: string;
}

async function getSecretValue(uniqueSecretName: string) {
	const prisma = prismaClient();
	const result = await prisma.$queryRaw<QueryResult[]>`select decrypted_secret
                                                       from vault.decrypted_secrets
                                                       where name = ${uniqueSecretName};`;
	if (result === null || result.length === 0) {
		throw new Error(`Failed to get secret ${uniqueSecretName}`);
	}
	return result[0].decrypted_secret;
}

async function storeSecret(secretValue: string, uniqueSecretName: string, secretDescription: string) {
	const prisma = prismaClient();

	const result = await prisma.$executeRaw`select vault.create_secret(${secretValue}, ${uniqueSecretName}, ${secretDescription});`;
	if (result === null) {
		throw new Error(`Failed to store secret ${uniqueSecretName}`);
	}
}

function tenantSecretName(tenantEnvironment: TenantEnvironment, secretShortName: string) {
	return `${tenantEnvironment.tenantId.value}:${tenantEnvironment.environmentId.value}:${secretShortName}`;
}

function systemSecretName(environmentId: EnvironmentId, secretShortName: string) {
	return `${environmentId.value}:${secretShortName}`;
}
