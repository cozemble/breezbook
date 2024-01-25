import express, { Express } from 'express';
import cors from 'cors';
import { logRequest } from '../infra/logRequest.js';
import { getServiceAvailability } from './getServiceAvailability.js';
import { addOrder } from './addOrder.js';
import { createStripePaymentIntent, onStripeWebhook } from './stripeEndpoint.js';
import bodyParser from 'body-parser';
import { IncomingMessage } from 'http';
import { handleReceivedWebhook } from './handleReceivedWebhook.js';
import { onOutboundWebhooksBatch } from './onOutboundWebhooksBatch.js';
import { bindInngestToExpress } from '../inngest/expressBinding.js';

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

	app.post('/internal/api/:envId/webhook/received', handleReceivedWebhook);
	app.post('/internal/api/:envId/system_outbound_webhooks/batch', onOutboundWebhooksBatch);

	bindInngestToExpress(app);

	return app;
}
