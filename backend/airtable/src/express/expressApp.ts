import express, { Express } from 'express';
import cors from 'cors';
import { logRequest } from '../infra/logRequest.js';
import { getServiceAvailability } from './getServiceAvailability.js';
import { addOrder } from './addOrder.js';
import { createStripePaymentIntent, onStripeWebhook } from './stripeEndpoint.js';
import * as bodyParser from 'body-parser';
import { IncomingMessage } from 'http';

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
	app.post('/api/:envId/:tenantId/service/:serviceId/availability/', getServiceAvailability);
	app.post('/api/:envId/:tenantId/orders', addOrder);
	app.post('/api/:envId/:tenantId/orders/:orderId/paymentIntent', createStripePaymentIntent);
	app.post('/api/:envId/:tenantId/stripe/webhook', onStripeWebhook);

	return app;
}
