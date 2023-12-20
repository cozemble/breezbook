import express, { Express, Router } from 'express'
import cors from 'cors'
import {logRequest} from "./infra/logRequest.js";
import {getServiceAvailability} from "./getServiceAvailability.js";

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

    // const routes: Router = Router()
    // routes.use('/ai-playground', prompts)
    // routes.use('/tenant', tenants)
    // routes.use('/auth', auth)
    // routes.use('/storage', makeStorageRoute(makeStorageProvider()))
    // routes.use('/storage', makeSignedUrlsRoute(makeStorageProvider()))
    //
    // app.use(
    //     '/:env/api/v1/',
    //     (req, res, next) => {
    //         req.env = req.params.env
    //         next()
    //     },
    //     routes,
    // )
    return app
}
