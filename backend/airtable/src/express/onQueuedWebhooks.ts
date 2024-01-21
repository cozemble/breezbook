import { environmentIdParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import { postedWebhookBody } from './handleReceivedWebhook.js';
import express from 'express';

export async function onQueuedWebhooks(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, environmentIdParam(), postedWebhookBody(), async (environmentId, webhookBody) => {
		// const response = await handleWebhook(webhookBody);
		// if (response._type === 'error.response') {
		// 	res.status(500).send(response);
		// 	return;
		// }
		res.status(200).send({});
	});
}
