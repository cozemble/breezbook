import { mandatory } from '@breezbook/packages-core';
import { internalApiPaths } from '../express/expressApp.js';
import { AccessTokenProvider } from '../airtable/airtableClient.js';
import {airtableSystemName} from "../express/oauth/airtableConnect.js";

export class AirtableAccessTokenProvider implements AccessTokenProvider {
	constructor(
		private readonly tenantId: string,
		private readonly environmentId: string
	) {}

	async getAccessToken(): Promise<string> {
		return getAirtableAccessToken(this.environmentId, this.tenantId);
	}
}

async function getAirtableAccessToken(environmentId: string, tenantId: string): Promise<string> {
	const breezBookUrlRoot = mandatory(process.env.BREEZBOOK_URL_ROOT, 'Missing BREEZBOOK_URL_ROOT');
	const internalApiKey = mandatory(process.env.INTERNAL_API_KEY, 'Missing INTERNAL_API_KEY');
	const getAccessTokenUrl =
		breezBookUrlRoot + internalApiPaths.getAccessToken.replace(':envId', environmentId).replace(':tenantId', tenantId).replace(':systemId', airtableSystemName);
	const accessTokenResponse = await fetch(getAccessTokenUrl, {
		method: 'GET',
		headers: {
			Authorization: internalApiKey
		}
	});
	if (!accessTokenResponse.ok) {
		throw new Error(`Failed to get access token from ${getAccessTokenUrl}, got status ${accessTokenResponse.status}`);
	}
	const accessTokenJson = await accessTokenResponse.json();
	return accessTokenJson.token;
}
