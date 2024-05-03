import * as express from 'express';
import {
    paramExtractor,
    ParamExtractor,
    path,
    RequestValueExtractor,
    tenantEnvironmentParam,
    withTwoRequestParams
} from '../../infra/functionalExpress.js';
import {prismaClient} from '../../prisma/client.js';
import {mandatory, SystemClock, TenantEnvironment} from '@breezbook/packages-core';
import {v4 as uuid} from 'uuid';

export function systemIdParam(requestValue: RequestValueExtractor = path('systemId')): ParamExtractor<string | null> {
    return paramExtractor('systemId', requestValue.extractor, (s) => s);
}

function expired(expires_at: Date, systemClock: SystemClock) {
    return expires_at.getTime() < systemClock.now().getTime();
}

export async function onGetAccessToken(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, tenantEnvironmentParam(), systemIdParam(), async (tenantEnvironment, systemParam) => {
        const prisma = prismaClient();
        const maybeToken = await prisma.oauth_tokens.findUnique({
            where: {
                tenant_id_environment_id_owning_system_token_type: {
                    tenant_id: tenantEnvironment.tenantId.value,
                    environment_id: tenantEnvironment.environmentId.value,
                    owning_system: systemParam,
                    token_type: 'access'
                }
            }
        });
        if (maybeToken && !expired(maybeToken.expires_at, new SystemClock())) {
            res.status(200).send({token: maybeToken.token});
            return;
        }
        const maybeRefreshToken = await prisma.oauth_tokens.findUnique({
            where: {
                tenant_id_environment_id_owning_system_token_type: {
                    tenant_id: tenantEnvironment.tenantId.value,
                    environment_id: tenantEnvironment.environmentId.value,
                    owning_system: systemParam,
                    token_type: 'refresh'
                }
            }
        });
        if (!maybeRefreshToken) {
            res.status(404).send({});
            return;
        }
        const {
            access_token,
            expires_in,
            fetchTimestamp,
            refresh_token,
            refresh_expires_in
        } = await refreshToken(maybeRefreshToken.token);
        await updateStoredToken(tenantEnvironment, systemParam, access_token, fetchTimestamp, expires_in, 'access');
        await updateStoredToken(tenantEnvironment, systemParam, refresh_token, fetchTimestamp, refresh_expires_in, 'refresh');
        res.status(200).send({token: access_token});
    });
}


async function updateStoredToken(
    tenantEnvironment: TenantEnvironment,
    systemId: string,
    newToken: string,
    issueTimestamp: string,
    expiresIn: number,
    tokenType: string
) {
    const expiryDate = new Date(new Date(issueTimestamp).getTime() + expiresIn * 1000);
    const prisma = prismaClient();
    await prisma.oauth_tokens.upsert({
        create: {
            id: uuid(),
            tenant_id: tenantEnvironment.tenantId.value,
            environment_id: tenantEnvironment.environmentId.value,
            owning_system: systemId,
            token_type: tokenType,
            token: newToken,
            expires_at: expiryDate
        },
        where: {
            tenant_id_environment_id_owning_system_token_type: {
                tenant_id: tenantEnvironment.tenantId.value,
                environment_id: tenantEnvironment.environmentId.value,
                owning_system: systemId,
                token_type: tokenType
            }
        },
        update: {
            token: newToken,
            expires_at: expiryDate
        }
    });
}

const airtableUrl = 'https://www.airtable.com';

async function refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    fetchTimestamp: string;
}> {
    const url = `${airtableUrl}/oauth2/v1/token`;
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const clientId = mandatory(process.env.AIRTABLE_CLIENT_ID, `No AIRTABLE_CLIENT_ID set`);

    const data: Record<string, string> = {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId
    };

    const fetchTimestamp = new Date().toISOString();
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: new URLSearchParams(data)
        });

        if (!response.ok) {
            if (response.status === 409) {
                throw new Error('Refresh token conflict detected. Please retry with a new refresh token.');
            } else {
                const text = await response.text();
                throw new Error(`Error refreshing token: ${response.statusText}, ${text}`);
            }
        }

        const result = await response.json();
        return {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            expires_in: result.expires_in,
            refresh_expires_in: result.refresh_expires_in,
            fetchTimestamp
        };
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
}
