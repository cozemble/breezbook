import * as express from 'express';
import { environmentIdParam, iso8601Timestamp, query, withDefault, withThreeRequestParams } from '../../infra/functionalExpress.js';
import { prismaClient } from '../../prisma/client.js';

function now() {
	return new Date().toISOString();
}

export async function onGetChanges(req: express.Request, res: express.Response): Promise<void> {
	await withThreeRequestParams(
		req,
		res,
		environmentIdParam(),
		iso8601Timestamp(query('from')),
		iso8601Timestamp(withDefault(query('to'), now())),
		async (environmentId, from, to) => {
			const prisma = prismaClient();
			const changes = await prisma.mutation_events.findMany({
				where: {
					environment_id: environmentId.value,
					event_time: {
						gte: from,
						lte: to
					}
				}
			});
			const bodies = changes.map((change) => ({ event: change.event_data, tenantId: change.tenant_id, environmentId: change.environment_id }));
			res.status(200).send({ environmentId, from, to, changes: bodies });
		}
	);
}
