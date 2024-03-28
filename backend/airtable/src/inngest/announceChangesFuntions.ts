import { inngest } from './client.js';
import { prismaClient } from '../prisma/client.js';

export const pollChangesFunction = inngest.createFunction({ id: 'announceChanges/poll-for-changes' }, { cron: '5 * * * *' }, async ({ step }) => {
	await step.run('fan-out-the-batch', async () => {
		const prisma = prismaClient();
		const allEnvironments = await prisma.mutation_events.findMany({
			select: {
				environment_id: true
			},
			distinct: ['environment_id']
		});
		console.log({ allEnvironments });
	});
});
