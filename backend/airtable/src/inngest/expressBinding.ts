import { serve } from 'inngest/express';
import { inngest } from './client.js';
import * as express from 'express';
import { helloWorld, onNewOutboundMessagesBatch } from './functions.js';

export function bindInngestToExpress(app: express.Application): void {
	app.use('/api/inngest', serve({ client: inngest, functions: [helloWorld, onNewOutboundMessagesBatch] }));
}
