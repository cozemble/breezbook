import {serve} from 'inngest/express';
import {inngest} from './client.js';
import * as express from 'express';
import {
    deferredChangeAnnouncement,
    fanOutChangesInAllEnvironments,
    onPendingChangeInTenantEnvironment
} from './announceChangesToAirtable.js';
import {onPaymentIntentSucceeded} from "./stripePayments.js";
import {onInngestFailure} from "./onInngestFailure.js";

export function bindInngestToExpress(app: express.Application): void {
    app.use(
        '/api/inngest',
        serve({
            client: inngest,
            functions: [
                fanOutChangesInAllEnvironments,
                onPendingChangeInTenantEnvironment,
                deferredChangeAnnouncement,
                onPaymentIntentSucceeded,
                onInngestFailure
            ]
        })
    );
}
