import { inngest } from './client.js';
import { prismaClient } from '../prisma/client.js';
import { mandatory } from '@breezbook/packages-core';
import { Mutation } from '../mutation/mutations.js';
import { PrismaSynchronisationIdRepository } from './dataSynchronisation.js';
import { HttpAirtableClient } from '../airtable/airtableClient.js';
import { carWashMapping } from '../airtable/learningMapping.js';
import { applyAirtablePlan } from '../airtable/applyAirtablePlan.js';
import { AirtableAccessTokenProvider } from './airtableAccessTokenProvider.js';

const announceChangesToAirtable = {
	fanOutChangesInAllEnvironments: 'announceChanges/airtable/fan-out-changes-in-all-environments',
	handleChangeBatchForOneEnvironment: 'announceChanges/airtable/handle-change-batch-for-one-environment',
	handleOneChange: 'announceChanges/airtable/handle-one-change'
};

export const fanOutChangesInAllEnvironments = inngest.createFunction(
	{ id: announceChangesToAirtable.fanOutChangesInAllEnvironments },
	{ cron: '5 * * * *' },
	async ({ step }) => {
		await step.run('fan-out-changes-in-all-environments', async () => {
			const prisma = prismaClient();
			const allEnvironments = await prisma.mutation_events
				.findMany({
					select: {
						environment_id: true
					},
					distinct: ['environment_id']
				})
				.then((events) => events.map((event) => event.environment_id));
			for (const environmentId of allEnvironments) {
				let lastPollForEnvironment = await prisma.last_change_announcements.findFirst({
					where: {
						environment_id: environmentId,
						channel_id: 'airtable'
					},
					orderBy: {
						announcement_date: 'desc'
					}
				});
				if (!lastPollForEnvironment) {
					lastPollForEnvironment = {
						announcement_date: new Date(0),
						environment_id: environmentId,
						id: 0,
						channel_id: 'airtable'
					};
				}
				const lastPollDate = lastPollForEnvironment.announcement_date;
				const now = new Date();
				await inngest.send({
					name: announceChangesToAirtable.handleChangeBatchForOneEnvironment,
					data: { environmentId, from: lastPollDate.toISOString(), to: now.toISOString() }
				});
				await prisma.last_change_announcements.create({
					data: {
						announcement_date: now,
						environment_id: environmentId,
						channel_id: 'airtable'
					}
				});
			}
		});
	}
);

export const handleChangeBatchForOneEnvironment = inngest.createFunction(
	{
		id: announceChangesToAirtable.handleChangeBatchForOneEnvironment,
		concurrency: {
			key: `event.data.environmentId`,
			limit: 1
		}
	},
	{ event: announceChangesToAirtable.handleChangeBatchForOneEnvironment },
	async ({ event, step }) => {
		await step.run('fan-out-changes-in-the-batch', async () => {
			const { environmentId, from, to } = event.data;
			const breezbookUrlRoot = mandatory(process.env.BREEZBOOK_URL_ROOT, 'Missing BREEZBOOK_URL_ROOT');
			const changesUrl = breezbookUrlRoot + `/internal/api/${environmentId}/changes?from=${from}&to=${to}`;

			const internalApiKey = mandatory(process.env.INTERNAL_API_KEY, 'INTERNAL_API_KEY');
			const changes = await fetch(changesUrl, {
				method: 'GET',
				headers: {
					Authorization: internalApiKey
				}
			});
			if (!changes.ok) {
				throw new Error(`Failed to fetch changes from ${changesUrl}, got status ${changes.status}`);
			}
			const changesJson = await changes.json();
			for (const change of changesJson.changes) {
				const { tenantId, environmentId, event } = change;
				await inngest.send({
					name: announceChangesToAirtable.handleOneChange,
					data: { tenantId, environmentId, event }
				});
			}
		});
	}
);

export const handleOneChange = inngest.createFunction(
	{
		id: announceChangesToAirtable.handleOneChange,
		concurrency: {
			key: `event.data.tenantId + "-" + event.data.environmentId`,
			limit: 1
		}
	},
	{ event: announceChangesToAirtable.handleOneChange },
	async ({ event, step }) => {
		await step.run('handle-one-change', async () => {
			const { environmentId, tenantId, event: givenEvent } = event.data;
			await applyAirtablePlan(
				new PrismaSynchronisationIdRepository(prismaClient(), tenantId as string, environmentId as string),
				new HttpAirtableClient('https://api.airtable.com/v0', new AirtableAccessTokenProvider(tenantId as string, environmentId as string)),
				carWashMapping,
				givenEvent as Mutation
			);
		});
	}
);
