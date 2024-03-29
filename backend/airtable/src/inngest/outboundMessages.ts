import { inngest } from './client.js';
import { prismaClient } from '../prisma/client.js';

export const outboundWebhooksEventNames = {
	batchCreated: 'outboundWebhooks/batch.created',
	sendQueued: 'outboundWebhooks/send.queued'
};

export const onNewOutboundMessagesBatch = inngest.createFunction(
	{ id: 'on-new-outbound-messages-batch', concurrency: 1 },
	{ event: outboundWebhooksEventNames.batchCreated },
	async ({ event, step }) => {
		await step.run('fan-out-the-batch', async () => {
			const prisma = prismaClient();
			const messagesInBatch = await prisma.system_outbound_webhooks.findMany({
				where: { batch_id: event.data.batchId },
				select: {
					id: true,
					environment_id: true,
					tenant_id: true,
					action: true,
					status: true,
					payload_type: true,
					payload: true,
					created_at: true
				},
				orderBy: { created_at: 'asc' }
			});
			const uniqueTenantIds = new Set(messagesInBatch.map((message) => message.tenant_id));
			const webhookDestinationsForTenantEnvironment = await prisma.webhook_destinations.findMany({
				where: { tenant_id: { in: Array.from(uniqueTenantIds) } }
			});
			const messagesWithDestinations = messagesInBatch
				.map((message) => {
					const destinations = webhookDestinationsForTenantEnvironment.filter(
						(destination) =>
							destination.tenant_id === message.tenant_id &&
							destination.environment_id === message.environment_id &&
							destination.payload_type === message.payload_type
					);
					return { message, destinations };
				})
				.filter(({ destinations }) => destinations.length > 0);

			const events = messagesWithDestinations.flatMap(({ message, destinations }) =>
				destinations.flatMap((destination) =>
					inngest.send({
						name: outboundWebhooksEventNames.sendQueued,
						data: { message, destination }
					})
				)
			);
			for (const event1 of events) {
				await event1;
			}
		});
	}
);

export const onOutboundWebhooksSendQueued = inngest.createFunction(
	{
		id: 'on-outbound-message-queued',
		concurrency: {
			key: `event.data.destination.tenant_id + "-" + event.data.destination.environment_id + "-" + event.data.destination.destination_system`,
			limit: 1
		}
	},
	{ event: outboundWebhooksEventNames.sendQueued },
	async ({ event, step }) => {
		await step.run('send-the-message', async () => {
			await fetch(event.data.destination.destination_url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(event.data.message.payload)
			});
		});
	}
);
