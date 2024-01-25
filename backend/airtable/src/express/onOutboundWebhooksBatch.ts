import { environmentIdParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import express from 'express';
import { inngest } from '../inngest/client.js';

interface OutboundWebhooksBatchBody {
	batch_id: string;
}

export function outboundWebhooksBatchBody(): (req: express.Request, res: express.Response) => OutboundWebhooksBatchBody | null {
	return (req, res) => {
		if (req.body === undefined) {
			res.status(400).send('Missing body');
			return null;
		}
		if (req.body.batch_id === undefined) {
			res.status(400).send('Missing batch_id');
			return null;
		}
		return {
			batch_id: req.body.batch_id
		};
	};
}

export async function onOutboundWebhooksBatch(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, environmentIdParam(), outboundWebhooksBatchBody(), async (environmentId, webhookBody) => {
		await inngest.send({
			name: 'outboundWebhooks/batch.created',
			data: {
				batchId: webhookBody.batch_id
			}
		});
		res.status(200).send({});
	});
}
