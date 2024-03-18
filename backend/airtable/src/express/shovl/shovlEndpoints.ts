import * as express from 'express';
import { withOneRequestParam } from '../../infra/functionalExpress.js';
import { dbBridge } from '../../infra/dbExpressBridge.js';

export async function onShovlOut(req: express.Request, res: express.Response): Promise<void> {
	await withOneRequestParam(req, res, dbBridge(), async (db) => {
		res.status(200).send({});
	});
}
