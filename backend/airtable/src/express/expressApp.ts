import express, { Express } from 'express'
import cors from 'cors'
import {logRequest} from "../infra/logRequest.js";
import {getServiceAvailability} from "./getServiceAvailability.js";
import {addOrder} from "./addOrder.js";

export function expressApp(): Express {
    const app: Express = express()

    const corsOptions = {}

    app.use(cors(corsOptions))
    app.use(express.json())

    app.use((req, res, next) => {
        logRequest(req)
        next()
    })
    app.post('/api/:tenantId/service/:serviceId/availability/', getServiceAvailability);
    app.post('/api/:tenantId/orders', addOrder);

    return app
}
