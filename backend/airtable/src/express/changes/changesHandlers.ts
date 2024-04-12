import * as express from 'express';
import {
    environmentIdParam,
    iso8601Timestamp,
    query,
    withDefault, withNoRequestParams,
    withOneRequestParam,
    withThreeRequestParams
} from '../../infra/functionalExpress.js';
import {prismaClient} from '../../prisma/client.js';
import { ChangeDates } from '@breezbook/backend-api-types';

function now() {
    return new Date().toISOString();
}

export async function onGetChangeDatesForAllEnvironments(req: express.Request, res: express.Response): Promise<void> {
    await withNoRequestParams(req, res,  async () => {
        const prisma = prismaClient();
        const allEnvironments = await prisma.mutation_events
            .findMany({
                select: {
                    environment_id: true
                },
                distinct: ['environment_id']
            })
            .then((events) => events.map((event) => event.environment_id));
        const changeDates: ChangeDates[] = []
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
            changeDates.push({environmentId, from: lastPollDate.toISOString(), to: now.toISOString()});
            await prisma.last_change_announcements.create({
                data: {
                    announcement_date: now,
                    environment_id: environmentId,
                    channel_id: 'airtable'
                }
            });

        }
        res.status(200).send({changeDates});
    });
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
            const bodies = changes.map((change) => ({
                event: change.event_data,
                tenantId: change.tenant_id,
                environmentId: change.environment_id
            }));
            res.status(200).send({environmentId, from, to, changes: bodies});
        }
    );
}
