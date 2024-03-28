import express, { Express } from 'express';
import cors from 'cors';
import { onAirtableOauthCallback, onAirtableOauthRequest } from './airtable/airtableExpress.js';

export function expressApp(): Express {
	const app: Express = express();

	const corsOptions = {};

	app.use(cors(corsOptions));

	app.get('/v1/connect/airtable/oauth2/authorize', onAirtableOauthRequest);
	app.get('/v1/connect/airtable/oauth2/callback', onAirtableOauthCallback);

	app.post('/v1/:env/:tenant/shovl/in', onAirtableOauthCallback);

	return app;
}
