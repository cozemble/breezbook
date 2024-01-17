import { test, expect } from 'vitest';
import { expressApp } from '../src/express/expressApp.js';

const expressPort = 3006;

test('calls to /internal/api requires an API key in the Authorization header', async () => {
	process.env.INTERNAL_API_KEY = 'test-api-key';
	const app = expressApp();
	app.listen(expressPort);
	const response = await fetch(`http://localhost:${expressPort}/internal/api/anything`);
	expect(response.status).toBe(401);
});
