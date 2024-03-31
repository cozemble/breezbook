import { inngest } from './client.js';
import { prismaClient } from '../prisma/client.js';
import { mandatory } from '@breezbook/packages-core';
import { Mutation, mutationFns } from '../mutation/mutations.js';
import { airtableMappings } from '../airtable/hardCodedAirtableMappings.js';
import { internalApiPaths } from '../express/expressApp.js';
import { createToAirtableSynchronisation, ToAirtableSynchronisation } from './airtableSynchronisation.js';
import { PrismaSynchronisationIdRepository } from './dataSynchronisation.js';
import { v4 as uuid } from 'uuid';

const announceChangesToAirtable = {
	fanOutChangesInAllEnvironments: 'announceChanges/airtable/fan-out-changes-in-all-environments',
	handleChangeBatchForOneEnvironment: 'announceChanges/airtable/handle-change-batch-for-one-environment',
	handleOneChange: 'announceChanges/airtable/handle-one-change',
	handleOneAirtableChange: 'announceChanges/airtable/handle-one-airtable-change',
	handleOneToAirtableSynchronisation: 'announceChanges/airtable/handle-one-to-airtable-synchronisation'
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
		const { event: givenEvent, mapping, environmentId, tenantId } = event.data;
		const airtableSynchronisations = await step.run('create-airtable-mutation', async () => {
			return await createToAirtableSynchronisation(givenEvent, mapping, new PrismaSynchronisationIdRepository(prismaClient(), tenantId, environmentId));
		});
		console.log(`Created ${airtableSynchronisations.length} airtable synchronisations for ${tenantId}:${environmentId}`);
		for (const synchronisation of airtableSynchronisations) {
			await inngest.send({
				name: announceChangesToAirtable.handleOneToAirtableSynchronisation,
				data: { synchronisation, environmentId, tenantId }
			});
		}
	}
);

export const handleOneToAirtableSynchronisation = inngest.createFunction(
	{
		id: announceChangesToAirtable.handleOneToAirtableSynchronisation,
		concurrency: {
			key: `event.data.tenantId + "-" + event.data.environmentId`,
			limit: 1
		}
	},
	{ event: announceChangesToAirtable.handleOneToAirtableSynchronisation },
	async ({ event, step }) => {
		const synchronisation = mandatory(event.data.synchronisation as ToAirtableSynchronisation, `Missing synchronisation in event.data.synchronisation`);
		const tenantId = mandatory(event.data.tenantId as string, 'Missing tenantId');
		const environmentId = mandatory(event.data.environmentId as string, `Missing environmentId`);
		const baseId = synchronisation.airtableMutation.baseId;
		const table = synchronisation.airtableMutation.table;

		const airtableRecordId = await step.run('sync-with-airtable', async () => {
			const accessToken = await getAirtableAccessToken(environmentId, tenantId);
			let airtableUrl = `https://api.airtable.com/v0/${baseId}/${table}`;
			if (synchronisation.airtableMutation._type === 'airtable.update') {
				airtableUrl += `/${synchronisation.airtableMutation.recordId}`;
			}
			const airtableResponse = await fetch(airtableUrl, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ fields: synchronisation.airtableMutation.fields })
			});
			if (!airtableResponse.ok) {
				const responseText = await airtableResponse.text();
				throw new Error(`Failed to POST to ${airtableUrl}, got status ${airtableResponse.status}, response: ${responseText}`);
			}
			const airtableResponseJson = await airtableResponse.json();
			const recordId = airtableResponseJson.id;
			console.log(`Sent to airtable, got record id ${recordId}`);
			return recordId;
		});

		await step.run('store-airtable-record-id', async () => {
			const prisma = prismaClient();
			if (synchronisation.airtableMutation._type === 'airtable.create') {
				await prisma.data_synchronisation_id_mappings.create({
					data: {
						id: uuid(),
						tenant_id: tenantId,
						environment_id: environmentId,
						entity_type: synchronisation.sourceEntity,
						from_system: 'breezbook',
						to_system: 'airtable',
						from_id: synchronisation.sourceEntityId.value,
						to_id: airtableRecordId
					}
				});
			}
		});
	}
);

async function getAirtableAccessToken(environmentId: string, tenantId: string): Promise<string> {
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
	return accessTokenJson.token;
}

async function maybeSendToAirtable(environmentId: string, tenantId: string, event: Mutation): Promise<void> {
	const entity = mutationFns.entity(event);
	const maybeAirtableMapping = airtableMappings.find(
		(mapping) => mapping.tenantId === tenantId && mapping.environmentId === environmentId && mapping.entityType === entity
	);
	if (!maybeAirtableMapping) {
		console.log(`No airtable mapping for entity ${entity} in ${tenantId}:${environmentId}`);
		return;
	} else {
		console.log(`Found airtable mapping for entity ${entity} in ${tenantId}:${environmentId}`);
	}
	await inngest.send({
		name: announceChangesToAirtable.handleOneAirtableChange,
		data: { tenantId, environmentId, event, mapping: maybeAirtableMapping }
	});
}
