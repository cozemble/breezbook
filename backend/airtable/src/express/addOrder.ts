import * as express from 'express';
import {tenantIdParam, withOneRequestParam} from "../infra/functionalExpress.js";

export async function addOrder(req: express.Request, res: express.Response): Promise<void> {
    await withOneRequestParam(req, res, tenantIdParam(), async (tenantId) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        res.send({orderId: '123'});
    })
}