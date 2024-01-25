import { inngest } from './client.js';
import { prismaClient } from '../prisma/client.js';

export const helloWorld = inngest.createFunction({ id: 'hello-world' }, { event: 'test/hello.world' }, async ({ event, step }) => {
	await step.sleep('wait-a-moment', '1s');
	return { event, body: 'Hello, World!' };
});

export const outboundWebhooksEventNames = {
	batchCreated: 'outboundWebhooks/batch.created',
	messageCreated: 'outboundWebhooks/message.created'
};

export const onNewOutboundMessagesBatch = inngest.createFunction(
	{ id: 'on-new-outbound-messages-batch', concurrency: 1 },
	{ event: outboundWebhooksEventNames.batchCreated },
	async ({ event, step }) => {
		await step.run('fan-out-the-batch', async () => {
			const prisma = prismaClient();
			const messagesInBatch = await prisma.system_outbound_webhooks.findMany({
				where: { batch_id: event.data.batchId },
				select: { id: true, environment_id: true, tenant_id: true, action: true, status: true, payload_type: true, payload: true }
			});
			const events = messagesInBatch.map((system_outbound_webhook) => {
				inngest.send({
					name: outboundWebhooksEventNames.messageCreated,
					data: {
						system_outbound_webhook
					}
				});
			});
			await Promise.all(events);
		});
	}
);
