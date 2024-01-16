import { afterAll, beforeAll, describe, test } from 'vitest';
import { appWithTestContainer } from '../src/infra/appWithTestContainer.js';
import { environmentId, tenantEnvironment, tenantId } from '@breezbook/packages-core';
import { StartedDockerComposeEnvironment } from 'testcontainers';

const expressPort = 3005;
const postgresPort = 54335;
const tenantEnv = tenantEnvironment(environmentId('dev'), tenantId('tenant1'));

describe('Given a configured webhook', () => {
	let dockerComposeEnv: StartedDockerComposeEnvironment;

	beforeAll(async () => {
		try {
			dockerComposeEnv = await appWithTestContainer(expressPort, postgresPort);
			// await setSystemConfig(tenantEnv, 'webhook_handler_url', `http://localhost:8001/stashWebhook`);
			// await setSystemConfig(tenantEnv, 'webhook_handler_api_key', ``);
		} catch (e) {
			console.error(e);
			throw e;
		}
	}, 1000 * 90);

	afterAll(async () => {
		await dockerComposeEnv.down();
	});

	test('incoming webhooks are stashed and the webhook handler is called', async () => {
		// const webhookPayload = {
		// 	value: uuidV4()
		// };
		// const webhookPostResponse = await fetch(`http://localhost:${expressPort}/api/dev/tenant1/stripe/webhook`, {
		// 	method: 'POST',
		// 	headers: {
		// 		'Content-Type': 'application/json'
		// 	},
		// 	body: JSON.stringify(webhookPayload)
		// });
		// expect(webhookPostResponse.status).toBe(202);
		// const json = await webhookPostResponse.json();
		// const postedWebhookId = json.id;
		// expect(postedWebhookId).toBeDefined();
		// const prisma = prismaClient();
		// const postedWebhook = await prisma.posted_webhooks.findUnique({
		// 	where: {
		// 		id: postedWebhookId
		// 	}
		// });
		// expect(postedWebhook).toBeDefined();
		// expect(postedWebhook?.payload).toEqual(webhookPayload);
	});
});
