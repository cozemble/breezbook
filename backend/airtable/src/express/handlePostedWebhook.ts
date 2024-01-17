import express from 'express';
import { environmentIdParam, withTwoRequestParams } from '../infra/functionalExpress.js';

export interface PostedWebhook {
	webhook_id: string;
	payload: unknown;
}

export function postedWebhookBody(): (req: express.Request, res: express.Response) => PostedWebhook | null {
	return (req, res) => {
		if (req.body === undefined) {
			res.status(400).send('Missing body');
			return null;
		}
		if (req.body.webhook_id === undefined) {
			res.status(400).send('Missing webhook_id');
			return null;
		}
		if (req.body.payload === undefined) {
			res.status(400).send('Missing payload');
			return null;
		}
		return {
			webhook_id: req.body.webhook_id,
			payload: req.body.payload
		};
	};
}

export async function handlePostedWebhook(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, environmentIdParam(), postedWebhookBody(), async (environmentId, webhookBody) => {
		res.status(200).send('ok');
	});
}
