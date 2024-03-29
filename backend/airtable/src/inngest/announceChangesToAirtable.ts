import { inngest } from './client.js';
import { prismaClient } from '../prisma/client.js';
import { mandatory } from '@breezbook/packages-core';
import { Mutation, mutationFns } from '../mutation/mutations.js';
import { airtableMappings } from '../airtable/hardCodedAirtableMappings.js';
import { internalApiPaths } from '../express/expressApp.js';

const announceChangesToAirtable = {
	pollAllEnvironments: 'announceChanges/airtable/poll-for-changes',
	handleBatchForOneEnvironment: 'announceChanges/airtable/handle-batch-for-one-environment',
	handleOneChange: 'announceChanges/airtable/handle-one-change',
	handleOneAirtableChange: 'announceChanges/airtable/handle-one-airtable-change'
};

export const pollChangesFunction = inngest.createFunction({ id: announceChangesToAirtable.pollAllEnvironments }, { cron: '5 * * * *' }, async ({ step }) => {
	await step.run('poll-for-changes', async () => {
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
				name: announceChangesToAirtable.handleBatchForOneEnvironment,
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
});

export const handleBatchForOneEnvironment = inngest.createFunction(
	{
		id: announceChangesToAirtable.handleBatchForOneEnvironment,
		concurrency: {
			key: `event.data.environmentId`,
			limit: 1
		}
	},
	{ event: announceChangesToAirtable.handleBatchForOneEnvironment },
	async ({ event, step }) => {
		await step.run('dispatch-changes-in-the-batch', async () => {
			const { environmentId, from, to } = event.data;
			const breezbookUrlRoot = mandatory(process.env.BREEZBOOK_URL_ROOT, 'Missing BREEZBOOK_URL_ROOT');
			const changesUrl = breezbookUrlRoot + `/internal/api/${environmentId}/changes?from=${from}&to=${to}`;
			console.log({ changesUrl });

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
			console.log({ changesJson: JSON.stringify(changesJson, null, 2) });
			for (const change of changesJson.changes) {
				const tenantId = mandatory(change.tenantId, 'Missing tenantId in change');
				const environmentId = mandatory(change.environmentId, 'Missing environmentId in change');
				const event = mandatory(change.event, 'Missing event in change');
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
			await maybeSendToAirtable(environmentId, tenantId, givenEvent);
		});
	}
);

export const handleOneAirtableChange = inngest.createFunction(
	{
		id: announceChangesToAirtable.handleOneAirtableChange,
		concurrency: {
			key: `event.data.tenantId + "-" + event.data.environmentId`,
			limit: 1
		}
	},
	{ event: announceChangesToAirtable.handleOneAirtableChange },
	async ({ event, step }) => {
		await step.run('handle-one-change', async () => {
			const { environmentId, tenantId, event: givenEvent, mapping } = event.data;
			const breezBookUrlRoot = mandatory(process.env.BREEZBOOK_URL_ROOT, 'Missing BREEZBOOK_URL_ROOT');
			const internalApiKey = mandatory(process.env.INTERNAL_API_KEY, 'Missing INTERNAL_API_KEY');
			const getAccessTokenUrl =
				breezBookUrlRoot + internalApiPaths.getAccessToken.replace(':envId', environmentId).replace(':tenantId', tenantId).replace(':systemId', 'airtable');
			const accessTokenResponse = await fetch(getAccessTokenUrl, {
				method: 'GET',
				headers: {
					Authorization: internalApiKey
				}
			});
			if (!accessTokenResponse.ok) {
				throw new Error(`Failed to get access token from ${getAccessTokenUrl}, got status ${accessTokenResponse.status}`);
			}
			const accessTokenJson = await accessTokenResponse.json();
			const accessToken = accessTokenJson.token;
			console.log({ environmentId, tenantId, event: givenEvent, mapping, accessToken });
		});
	}
);

async function maybeSendToAirtable(environmentId: string, tenantId: string, event: Mutation): Promise<void> {
	const prisma = prismaClient();
	const maybeAirtableAccessToken = await prisma.oauth_tokens.findUnique({
		where: {
			tenant_id_environment_id_owning_system_token_type: {
				tenant_id: tenantId,
				environment_id: environmentId,
				owning_system: 'airtable',
				token_type: 'access'
			}
		}
	});
	if (!maybeAirtableAccessToken) {
		console.log(`No airtable access token for ${tenantId} in ${environmentId}`);
		return;
	}
	const maybeAirtableMapping = airtableMappings.find(
		(mapping) => mapping.tenantId === tenantId && mapping.environmentId === environmentId && mapping.entityType === mutationFns.entity(event)
	);
	if (!maybeAirtableMapping) {
		console.log(`No airtable mapping for ${tenantId} in ${environmentId}`);
		return;
	}
	console.log(`Sending to airtable`);
	await inngest.send({
		name: announceChangesToAirtable.handleOneAirtableChange,
		data: { tenantId, environmentId, event, mapping: maybeAirtableMapping }
	});
}
