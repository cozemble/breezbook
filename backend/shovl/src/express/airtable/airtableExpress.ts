import * as express from 'express';
import * as crypto from 'crypto';
import axios from 'axios';
import * as qs from 'qs';

const airtableUrl = 'https://www.airtable.com';
const authorizationCache = {} as Record<string, { codeVerifier: string }>;
const scope = 'data.records:read data.records:write schema.bases:read';

export async function onAirtableOauthCallback(req: express.Request, res: express.Response): Promise<void> {
	const clientId = process.env.AIRTABLE_CLIENT_ID;
	const redirectUri = process.env.AIRTABLE_REDIRECT_URI;
	if (!clientId || !redirectUri) {
		console.log('AIRTABLE_CLIENT_ID or AIRTABLE_REDIRECT_URI not set');
		res.status(500).send('AIRTABLE_CLIENT_ID or AIRTABLE_REDIRECT_URI not set');
		return;
	}

	const state = (req.query.state ?? '') as string;
	console.log({ authorizationCache, state });

	const cached = authorizationCache[state];
	// validate request, you can include other custom checks here as well
	if (cached === undefined) {
		res.send('This request was not from Airtable!');
		return;
	}
	// clear the cache
	delete authorizationCache[state];

	// Check if the redirect includes an error code.
	// Note that if your client_id and redirect_uri do not match the user will never be re-directed
	// Note also that if you did not include "state" in the request, then this redirect would also not include "state"
	if (req.query.error) {
		const error = req.query.error;
		const errorDescription = req.query.error_description;
		res.send(`
            There was an error authorizing this request.
            <br/>Error: "${error}"
            <br/>Error Description: "${errorDescription}"
        `);
		return;
	}

	// since the authorization didn't error, we know there's a grant code in the query
	// we also retrieve the stashed code_verifier for this request
	const code = req.query.code;
	const codeVerifier = cached.codeVerifier;

	const headers = {
		// Content-Type is always required
		'Content-Type': 'application/x-www-form-urlencoded'
	};

	// make the POST request
	axios({
		method: 'POST',
		url: `${airtableUrl}/oauth2/v1/token`,
		headers,
		// stringify the request body like a URL query string
		data: qs.stringify({
			// client_id is optional if authorization header provided
			// required otherwise.
			client_id: clientId,
			code_verifier: codeVerifier,
			redirect_uri: redirectUri,
			code,
			grant_type: 'authorization_code'
		})
	})
		.then((response: any) => {
			res.send(response.data);
		})
		.catch((e: any) => {
			// 400 and 401 errors mean some problem in our configuration, the user waited too
			// long to authorize, or there were multiple requests using this auth code.
			// We expect these but not other error codes during normal operations
			if (e.response && [400, 401].includes(e.response.status)) {
				res.send({ error: e.response.data, status: e.response.status, errorType: 'AUTHORIZATION_ERROR' });
			} else if (e.response) {
				console.log('uh oh, something went wrong', e.response.data);
				res.send({ error: e.response.data, status: e.response.status, errorType: 'UNKNOWN_AUTHORIZATION_ERROR' });
			} else {
				console.log('uh oh, something went wrong', e);
				res.send({ error: e, errorType: 'UNKNOWN_AUTHORIZATION_ERROR' });
			}
			res.redirect('/');
		});
}

export async function onAirtableOauthRequest(req: express.Request, res: express.Response): Promise<void> {
	const state = crypto.randomBytes(100).toString('base64url');
	const clientId = process.env.AIRTABLE_CLIENT_ID;
	const redirectUri = process.env.AIRTABLE_REDIRECT_URI;
	if (!clientId || !redirectUri) {
		console.log('AIRTABLE_CLIENT_ID or AIRTABLE_REDIRECT_URI not set');
		res.status(500).send('AIRTABLE_CLIENT_ID or AIRTABLE_REDIRECT_URI not set');
		return;
	}

	// prevents others from impersonating you
	const codeVerifier = crypto.randomBytes(96).toString('base64url'); // 128 characters
	const codeChallengeMethod = 'S256';
	const codeChallenge = crypto
		.createHash('sha256')
		.update(codeVerifier) // hash the code verifier with the sha256 algorithm
		.digest('base64') // base64 encode, needs to be transformed to base64url
		.replace(/=/g, '') // remove =
		.replace(/\+/g, '-') // replace + with -
		.replace(/\//g, '_'); // replace / with _ now base64url encoded

	// ideally, entries in this cache expires after ~10-15 minutes
	authorizationCache[state] = {
		// we'll use this in the redirect url route
		codeVerifier
		// any other data you want to store, like the user's ID
	};
	console.log({ authorizationCache });

	// build the authorization URL
	const authorizationUrl = new URL(`${airtableUrl}/oauth2/v1/authorize`);
	authorizationUrl.searchParams.set('code_challenge', codeChallenge);
	authorizationUrl.searchParams.set('code_challenge_method', codeChallengeMethod);
	authorizationUrl.searchParams.set('state', state);
	authorizationUrl.searchParams.set('client_id', clientId);
	authorizationUrl.searchParams.set('redirect_uri', redirectUri);
	authorizationUrl.searchParams.set('response_type', 'code');
	// your OAuth integration register with these scopes in the management page
	authorizationUrl.searchParams.set('scope', scope);

	// redirect the user and request authorization
	res.redirect(authorizationUrl.toString());
}
