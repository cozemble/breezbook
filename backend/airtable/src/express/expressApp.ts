import express, {Express} from 'express';
import cors from 'cors';
import {logRequest} from '../infra/logRequest.js';
import {getServiceAvailability} from './getServiceAvailability.js';
import {addOrder} from './addOrder.js';
import {createStripePaymentIntent, onStripeWebhook} from './stripeEndpoint.js';
import bodyParser from 'body-parser';
import {IncomingMessage} from 'http';
import {handleReceivedWebhook} from './handleReceivedWebhook.js';
import {onOutboundWebhooksBatch} from './onOutboundWebhooksBatch.js';
import {bindInngestToExpress} from '../inngest/expressBinding.js';
import {commitCancellation, requestCancellationGrant} from './cancellation.js';
import {onStoreTenantSecret} from './secretManagement.js';
import {couponValidityCheck} from './coupons/couponHandlers.js';
import {onBasketPriceRequest} from './basket/basketHandler.js';
import {onShovlOut} from './shovl/shovlEndpoints.js';
import {onGetChangeDatesForAllEnvironments, onGetChanges} from './changes/changesHandlers.js';
import {onGetAccessToken} from './oauth/oauthHandlers.js';
import {onPublishReferenceDataAsMutationEvents} from './temp/onPublishReferenceDataAsMutationEvents.js';
import {onGetServicesRequest} from "./services/serviceHandlers.js";
import {onGetTenantRequest} from "./tenants/tenantHandlers.js";
import {environmentIdParam, withNoRequestParams, withTwoRequestParams} from "../infra/functionalExpress.js";
import {prismaClient} from "../prisma/client.js";
import {setupDevEnvironment} from "../dx/setupDevEnvironment.js";

interface IncomingMessageWithBody extends IncomingMessage {
    rawBody?: string;
}

export function expressApp(): Express {
    const app: Express = express();

    const corsOptions = {};

    app.use(cors(corsOptions));
    app.use(
        bodyParser.json({
            verify: (req: IncomingMessageWithBody, res, buf) => {
                req.rawBody = buf.toString();
            }
        })
    );

    app.use((req, res, next) => {
        logRequest(req);
        next();
    });

    app.use((req, res, next) => {
        if (req.url.startsWith('/internal/api')) {
            const expectedApiKey = process.env.INTERNAL_API_KEY;
            if (!expectedApiKey) {
                res.status(500).send('INTERNAL_API_KEY not set');
                return;
            }
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                res.status(401).send('Unauthorized');
                return;
            }
            if (authHeader !== expectedApiKey) {
                res.status(403).send('Forbidden');
                return;
            }
        }
        next();
    });

    app.post('/api/:envId/:tenantId/service/:serviceId/availability/', getServiceAvailability);
    app.post('/api/:envId/:tenantId/orders', addOrder);
    app.post('/api/:envId/:tenantId/orders/:orderId/paymentIntent', createStripePaymentIntent);
    app.post('/api/:envId/:tenantId/stripe/webhook', onStripeWebhook);
    app.post('/api/:envId/:tenantId/booking/:bookingId/cancellation/grant', requestCancellationGrant);
    app.post('/api/:envId/:tenantId/booking/:bookingId/cancellation/:cancellationId/commit', commitCancellation);
    app.get('/api/:envId/:tenantId/coupon/validity', couponValidityCheck);
    app.post('/api/:envId/:tenantId/basket/price', onBasketPriceRequest);
    app.get(externalApiPaths.getServices, onGetServicesRequest);
    app.get(externalApiPaths.getTenant, onGetTenantRequest);

    app.post('/internal/api/:envId/webhook/received', handleReceivedWebhook);
    app.post('/internal/api/:envId/system_outbound_webhooks/batch', onOutboundWebhooksBatch);
    app.post('/internal/api/:envId/:tenantId/secret', onStoreTenantSecret);
    app.post('/internal/api/:envId/shovl/out', onShovlOut);
    app.get(internalApiPaths.getChangeDatesForAllEnvironments, onGetChangeDatesForAllEnvironments);
    app.get(internalApiPaths.getChangesForEnvironment, onGetChanges);
    app.get(internalApiPaths.getAccessToken, onGetAccessToken);
    app.post(internalApiPaths.publishReferenceDataAsMutationEvents, onPublishReferenceDataAsMutationEvents);
    app.post(internalApiPaths.onAppStart, onAppStartRequest);

    bindInngestToExpress(app);

    return app;
}

export const internalApiPaths = {
    getChangeDatesForAllEnvironments: '/internal/api/changes/dates',
    getChangesForEnvironment: '/internal/api/:envId/changes',
    getAccessToken: '/internal/api/:envId/:tenantId/oauth/:systemId/accessToken',
    publishReferenceDataAsMutationEvents: '/internal/api/:envId/:tenantId/referenceData/publishAsMutationEvents',
    onAppStart: '/internal/api/onAppStart',
};

export const externalApiPaths = {
    getTenant: '/api/:envId/tenants',
    getServices: '/api/:envId/:tenantId/services',
}

async function onAppStartRequest(req: express.Request, res: express.Response): Promise<void> {
    await withNoRequestParams(req, res,  async () => {
        await setupDevEnvironment().catch(e => console.error(e));
        res.status(200).send({status: 'ok'});
    });
}
