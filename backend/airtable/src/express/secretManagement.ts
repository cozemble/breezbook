import { ParamExtractor, tenantEnvironmentParam, withTwoRequestParams } from '../infra/functionalExpress.js';
import express from 'express';
import { SecretValueSpecification } from '@breezbook/backend-api-types';
import { storeTenantSecret } from '../infra/secretsInPostgres.js';

export function secretValueSpecificationBody(): ParamExtractor<SecretValueSpecification | null> {
	return (req: express.Request, res: express.Response) => {
		const body = req.body as SecretValueSpecification | null;
		if (!body) {
			res.status(400).send(`Missing required body`);
			return null;
		}
		console.log({body})
		if (body._type !== 'secret.value.specification') {
			res.status(400).send(`Posted body is not a secret value specification`);
			return null;
		}
		return body;
	};
}

export async function onStoreTenantSecret(req: express.Request, res: express.Response): Promise<void> {
	await withTwoRequestParams(req, res, tenantEnvironmentParam(), secretValueSpecificationBody(), async (tenantEnvironment, secretValue) => {
		await storeTenantSecret(tenantEnvironment, secretValue.uniqueSecretName, secretValue.secretDescription, secretValue.secretValue);
		res.status(200).send({});
	});
}
