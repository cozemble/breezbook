import express, { Express } from 'express';
import cors from 'cors';
import { logRequest } from '../infra/logRequest.js';
import { getServiceAvailability } from './getServiceAvailability.js';
import { addOrder } from './addOrder.js';
import { createStripePaymentIntent } from './stripeEndpoint.js';

export function expressApp(): Express {
	const app: Express = express();

	const corsOptions = {};

	app.use(cors(corsOptions));
	app.use(express.json());

	app.use((req, res, next) => {
		logRequest(req);
		next();
	});
	app.post('/api/:envId/:tenantId/service/:serviceId/availability/', getServiceAvailability);
	app.post('/api/:envId/:tenantId/orders', addOrder);
	app.post('/api/:envId/:tenantId/orders/:orderId/paymentIntent', createStripePaymentIntent);

	return app;
}
