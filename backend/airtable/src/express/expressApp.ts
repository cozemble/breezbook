import express, {Express} from 'express';
import cors from 'cors';
import {logRequest} from '../infra/logRequest.js';
import {onAddOrderExpress} from './onAddOrderExpress.js';
import {createStripePaymentIntent, onStripeWebhook} from './stripeEndpoint.js';
import bodyParser from 'body-parser';
import {IncomingMessage} from 'http';
import {handleReceivedWebhook} from './handleReceivedWebhook.js';
import {bindInngestToExpress} from '../inngest/expressBinding.js';
import {commitCancellation, requestCancellationGrant} from './cancellation.js';
import {onStoreTenantSecret} from './secretManagement.js';
import {couponValidityCheck} from './coupons/couponHandlers.js';
import {onBasketPriceRequestExpress} from './basket/basketHandler.js';
import {onGetAccessToken} from './oauth/oauthHandlers.js';
import {onPublishReferenceDataAsMutationEvents} from './temp/onPublishReferenceDataAsMutationEvents.js';
import {onGetServicesRequest} from "./services/serviceHandlers.js";
import {onGetTenantRequestExpress} from "./tenants/tenantHandlers.js";
import {withNoRequestParams} from "../infra/functionalExpress.js";
import {setupDevEnvironment} from "../dx/setupDevEnvironment.js";
import {onAirtableOauthBegin, onAirtableOauthCallback} from "./oauth/airtableConnect.js";
import {onVapiVoiceBotPromptRequest} from "./voicebot/vapiHandlers.js";
import {onWaitlistSignup} from "./waitlist/onWaitlistSignup.js";
import {onListResourcesByTypeRequestExpress} from "./resources/resourcesHandler.js";
import {onGetServiceAvailabilityForLocationExpress} from "./availability/getServiceAvailabilityForLocation.js";

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

    app.post(externalApiPaths.getAvailabilityForLocation, onGetServiceAvailabilityForLocationExpress);
    app.post(externalApiPaths.addOrder, onAddOrderExpress);
    app.post('/api/:envId/:tenantId/orders/:orderId/paymentIntent', createStripePaymentIntent);
    app.post('/api/:envId/:tenantId/stripe/webhook', onStripeWebhook);
    app.post('/api/:envId/:tenantId/booking/:bookingId/cancellation/grant', requestCancellationGrant);
    app.post('/api/:envId/:tenantId/booking/:bookingId/cancellation/:cancellationId/commit', commitCancellation);
    app.get('/api/:envId/:tenantId/coupon/validity', couponValidityCheck);
    app.post(externalApiPaths.priceBasket, onBasketPriceRequestExpress);
    app.get(externalApiPaths.getServices, onGetServicesRequest);
    app.get(externalApiPaths.getTenant, onGetTenantRequestExpress);
    app.get(externalApiPaths.airtableOauthBegin, onAirtableOauthBegin);
    app.get(externalApiPaths.airtableOauthCallback, onAirtableOauthCallback);
    app.get(externalApiPaths.vapiVoiceBotPrompt, onVapiVoiceBotPromptRequest);
    app.get(externalApiPaths.listResourcesByType, onListResourcesByTypeRequestExpress);
    app.post(externalApiPaths.waitlistSignup, onWaitlistSignup);

    app.post('/internal/api/:envId/webhook/received', handleReceivedWebhook);
    app.post('/internal/api/:envId/:tenantId/secret', onStoreTenantSecret);
    app.get(internalApiPaths.getAccessToken, onGetAccessToken);
    app.post(internalApiPaths.publishReferenceDataAsMutationEvents, onPublishReferenceDataAsMutationEvents);
    app.post(internalApiPaths.onAppStart, onAppStartRequest);

    bindInngestToExpress(app);

    return app;
}

export const internalApiPaths = {
    getAccessToken: '/internal/api/:envId/:tenantId/oauth/:systemId/accessToken',
    publishReferenceDataAsMutationEvents: '/internal/api/:envId/:tenantId/referenceData/publishAsMutationEvents',
    onAppStart: '/internal/api/onAppStart',
};

export const externalApiPaths = {
    getTenant: '/api/:envId/tenants',
    getServices: '/api/:envId/:tenantId/services',
    getAvailabilityForLocation: '/api/:envId/:tenantId/:locationId/service/:serviceId/availability',
    airtableOauthBegin: '/v1/connect/airtable/oauth2/authorize',
    airtableOauthCallback: '/v1/connect/airtable/oauth2/callback',
    vapiVoiceBotPrompt: '/api/:envId/:tenantId/:locationId/voicebot/vapi/prompt',
    listResourcesByType: '/api/:envId/:tenantId/:locationId/resources/:type/list',
    waitlistSignup: '/api/signup/waitlist',
    priceBasket: '/api/:envId/:tenantId/basket/price',
    addOrder: '/api/:envId/:tenantId/orders',
}

async function onAppStartRequest(req: express.Request, res: express.Response): Promise<void> {
    await withNoRequestParams(req, res, async () => {
        await setupDevEnvironment().catch(e => console.error(e));
        res.status(200).send({status: 'ok'});
    });
}
