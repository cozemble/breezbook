import { serve } from 'inngest/express';
import { inngest } from './client.js';
import * as express from 'express';
import { onNewOutboundMessagesBatch, onOutboundWebhooksSendQueued } from './outboundMessages.js';
import { handleBatchForOneEnvironment, handleOneAirtableChange, handleOneChange, pollChangesFunction } from './announceChangesToAirtable.js';

export function bindInngestToExpress(app: express.Application): void {
	app.use(
		'/api/inngest',
		serve({
			client: inngest,
			functions: [
				onNewOutboundMessagesBatch,
				onOutboundWebhooksSendQueued,
				pollChangesFunction,
				handleBatchForOneEnvironment,
				handleOneChange,
				handleOneAirtableChange
			]
		})
	);
}
