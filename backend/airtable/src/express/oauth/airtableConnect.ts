import * as express from "express";
import crypto from "crypto";
import * as qs from "qs";
import {simpleKvStore} from "../../kv-store/simpleKvStore.js";
import {
    paramExtractor,
    ParamExtractor,
    query,
    RequestValueExtractor,
    withTwoRequestParams
} from "../../infra/functionalExpress.js";
import {prismaClient} from "../../prisma/client.js";
import {PrismaClient} from "@prisma/client";
import {v4 as uuid} from 'uuid';
import {mandatory} from "@breezbook/packages-core";

const airtableUrl = 'https://www.airtable.com';
const scope = 'data.records:read data.records:write schema.bases:read';
export const airtableSystemName = 'airtable'
export const refreshTokenName = 'refresh'


function tenantIdQueryParam(requestValue: RequestValueExtractor = query('tenantId')): ParamExtractor<string | null> {
    return paramExtractor('tenantId', requestValue.extractor, (s) => s);
}

function environmentIdQueryParam(requestValue: RequestValueExtractor = query('environmentId')): ParamExtractor<string | null> {
    return paramExtractor('environmentId', requestValue.extractor, (s) => s);
}

export async function onAirtableOauthBegin(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, tenantIdQueryParam(), environmentIdQueryParam(), async (tenantId, environmentId) => {
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
        await simpleKvStore().set(state, codeVerifier, new Date(Date.now() + 15 * 60 * 1000));
        const context = {tenantId, environmentId}
        await simpleKvStore().set(state + "-context", JSON.stringify(context), new Date(Date.now() + 15 * 60 * 1000));


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
    });

}

async function upsertRefreshToken(prisma: PrismaClient, tenantId: string, environmentId: string, refreshToken: string, refreshExpiresIn: number) {
    const expiryInMillis = refreshExpiresIn * 1000;
    const expiry = new Date(new Date().getTime() + expiryInMillis);
    await prisma.oauth_tokens.upsert({
        where: {
            tenant_id_environment_id_owning_system_token_type: {
                tenant_id: tenantId,
                environment_id: environmentId,
                owning_system: airtableSystemName,
                token_type: refreshTokenName
            }
        },
        create: {
            id: uuid(),
            tenant_id: tenantId,
            environment_id: environmentId,
            owning_system: airtableSystemName,
            token_type: refreshTokenName,
            token: refreshToken,
            expires_at: expiry
        },
        update: {
            token: refreshToken,
            expires_at: expiry
        }
    })

}

export async function onAirtableOauthCallback(req: express.Request, res: express.Response): Promise<void> {
    const clientId = process.env.AIRTABLE_CLIENT_ID;
    const redirectUri = process.env.AIRTABLE_REDIRECT_URI;
    if (!clientId || !redirectUri) {
        console.log('AIRTABLE_CLIENT_ID or AIRTABLE_REDIRECT_URI not set');
        res.status(500).send('AIRTABLE_CLIENT_ID or AIRTABLE_REDIRECT_URI not set');
        return;
    }

    const state = (req.query.state ?? '') as string;

    const codeVerifier = await simpleKvStore().get(state)

    // validate request, you can include other custom checks here as well
    if (codeVerifier === null) {
        res.send('This request was not from Airtable!');
        return;
    }
    // clear the cache
    await simpleKvStore().delete(state);

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

    const headers = {
        // Content-Type is always required
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    // make the POST request
    const url = `${airtableUrl}/oauth2/v1/token`;
    const requestBody = qs.stringify({
        client_id: clientId,
        code_verifier: codeVerifier,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code'
    });
    fetch(url, {
        method: 'POST',
        headers,
        body: requestBody
    })
        .then((response: any) => {
            if (!response.ok && ![400, 401].includes(response.status)) {
                console.log('uh oh, something went wrong');
                throw new Error('Unknown authorization error');
            } else {
                return response.json();
            }
        })
        .then(async (data: any) => {
            const context = await simpleKvStore().get(state + "-context");
            if (!context) {
                res.send("Missing context for oauth callback");
                return;
            }
            const {tenantId, environmentId} = JSON.parse(context);
            if (!tenantId || !environmentId) {
                res.send("Malformed context for oauth callback");
            } else {
                await upsertRefreshToken(prismaClient(), tenantId, environmentId, mandatory(data.refresh_token, `Missing refresh_token`), mandatory(data.refresh_expires_in, `Missing refresh_expires_in`))
                res.send(`Refresh token set for ${tenantId}:${environmentId}`);
            }
        })
        .catch(async (e: any) => {
            console.error(e);
            if (e.name === 'Error') {
                res.send({error: e.message, errorType: 'UNKNOWN_AUTHORIZATION_ERROR'});
            } else {
                const responseData = await e.json();
                res.send({error: responseData, status: e.status, errorType: 'AUTHORIZATION_ERROR'});
                res.redirect('/');
            }
        });
}