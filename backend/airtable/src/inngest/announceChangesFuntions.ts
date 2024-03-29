import { inngest } from './client.js';
import { prismaClient } from '../prisma/client.js';

export const pollChangesFunction = inngest.createFunction({ id: 'announceChanges/poll-for-changes' }, { cron: '5 * * * *' }, async ({ step }) => {
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
		console.log({ allEnvironments });
		for (const environmentId of allEnvironments) {
			let lastPoll = await prisma.last_change_announcements.findFirst({
				where: {
					environment_id: environmentId
				},
				orderBy: {
					announcement_date: 'desc'
				}
			});
			if (!lastPoll) {
				lastPoll = { announcement_date: new Date(0), environment_id: environmentId, id: 0 };
			}
			const lastPollDate = lastPoll.announcement_date;
			const changes = await prisma.mutation_events.findMany({
				where: {
					environment_id: environmentId,
					event_time: {
						gt: lastPollDate
					}
				}
			});
			console.log({ changes });
		}
	});
});
