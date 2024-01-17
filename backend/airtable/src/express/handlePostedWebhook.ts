import express from 'express';

export async function handlePostedWebhook(req: express.Request, res: express.Response): Promise<void> {
	res.status(200).send('ok');
}
