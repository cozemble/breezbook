import { afterAll, beforeAll, describe, test, expect } from 'vitest';
import { appWithTestContainer } from '../src/infra/appWithTestContainer.js';
import { environmentId, tenantEnvironment, tenantId } from '@breezbook/packages-core';
import { StartedDockerComposeEnvironment } from 'testcontainers';
import { setSystemConfig } from '../src/prisma/setSystemConfig.js';
import { prismaClient } from '../src/prisma/client.js';
import { v4 as uuidV4 } from 'uuid';

const expressPort = 3005;
const postgresPort = 54335;
const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given a configured webhook', () => {
	let dockerComposeEnv: StartedDockerComposeEnvironment;

	beforeAll(async () => {
		try {
			dockerComposeEnv = await appWithTestContainer(expressPort, postgresPort);
			await setSystemConfig(tenantEnv, 'received_webhook_handler_url', `http://localhost:8001/stashWebhook`);
			await setSystemConfig(tenantEnv, 'received_webhook_handler_api_key', ``);
		} catch (e) {
			console.error(e);
			throw e;
		}
	}, 1000 * 90);

	afterAll(async () => {
		await dockerComposeEnv.down();
	});

	test('incoming webhooks are stashed and the webhook handler is called', async () => {
		const webhookPayload = {
			value: uuidV4()
		};
		const webhookPostResponse = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/stripe/webhook`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(webhookPayload)
		});
		expect(webhookPostResponse.status).toBe(202);
		const json = await webhookPostResponse.json();
		const postedWebhookId = json.id;
		expect(postedWebhookId).toBeDefined();
		const prisma = prismaClient();
		const postedWebhook = await prisma.received_webhooks.findUnique({
			where: {
				id: postedWebhookId
			}
		});
		expect(postedWebhook).toBeDefined();
		expect(postedWebhook?.payload).toEqual(webhookPayload);
	});
});
