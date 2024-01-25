// Cloudflare uses JS standard library Request + Response objects for
// managing the handler.  We import that here and invoke this.
import { serve } from 'inngest/cloudflare';
import { inngest } from '$lib/inngest/client';
import { helloWorld } from '$lib/inngest/functions';

// Create a new handler.
const handler = serve({
	client: inngest,
	functions: [
		helloWorld // <-- This is where you'll always add all your functions
	]
});

const env = {
	INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
	INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
	ENVIRONMENT: 'development' // change from production to anything in development.
};

export function GET({ request }) {
	// Wrap and call our handler.
	return handler({ request, env });
}

export function PUT({ request }) {
	return handler({ request, env });
}

export function POST({ request }) {
	return handler({ request, env });
}
