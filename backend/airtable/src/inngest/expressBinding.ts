import {serve} from 'inngest/express';
import {inngest} from './client.js';
import * as express from 'express';
import {fanOutChangesInAllEnvironments, onPendingChangeInTenantEnvironment} from './announceChangesToAirtable.js';
import {onPaymentIntentSucceeded} from "./stripePayments.js";

export function bindInngestToExpress(app: express.Application): void {
    app.use(
        '/api/inngest',
        serve({
            client: inngest,
            functions: [fanOutChangesInAllEnvironments, onPendingChangeInTenantEnvironment, onPaymentIntentSucceeded]
        })
    );
}
