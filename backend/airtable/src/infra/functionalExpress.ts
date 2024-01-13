import express from 'express';
import {
	EnvironmentId,
	environmentId,
	isoDate,
	IsoDate,
	OrderId,
	orderId,
	serviceId,
	ServiceId,
	tenantEnvironment,
	TenantEnvironment,
	tenantId,
	TenantId
} from '@breezbook/packages-core';
import { CreateOrderRequest } from '@breezbook/backend-api-types';

export interface RequestValueExtractor {
	name: string;
	extractor: (req: express.Request) => string | null;
}

export function query(paramName: string): RequestValueExtractor {
	const extractor = (req: express.Request) => {
		const paramValue = req.query[paramName];
		if (!paramValue) {
			return null;
		}
		return paramValue as string;
	};
	return { name: paramName, extractor };
}

export function path(paramName: string): RequestValueExtractor {
	const extractor = (req: express.Request) => {
		const paramValue = req.params[paramName];
		if (!paramValue) {
			return null;
		}
		return paramValue;
	};
	return { name: paramName, extractor };
}

type ParamExtractor<T> = (req: express.Request, res: express.Response) => T | null;

export function date(requestValue: RequestValueExtractor): ParamExtractor<IsoDate | null> {
	return (req: express.Request, res: express.Response) => {
		const paramValue = requestValue.extractor(req);
		if (!paramValue) {
			res.status(400).send(`Missing required parameter ${requestValue.name}`);
			return null;
		}
		try {
			return isoDate(paramValue);
		} catch (error) {
			res.status(400).send(`Invalid date format ${paramValue}. Expected YYYY-MM-DD`);
			return null;
		}
	};
}

export function createOrderRequest(): ParamExtractor<CreateOrderRequest | null> {
	return (req: express.Request, res: express.Response) => {
		const body = req.body as CreateOrderRequest | null;
		if (!body) {
			res.status(400).send(`Missing required body`);
			return null;
		}
		if (body._type !== 'create.order.request') {
			res.status(400).send(`Posted body is not a create order request`);
			return null;
		}
		return body;
	};
}

export function tenantIdParam(requestValue: RequestValueExtractor = path('tenantId')): ParamExtractor<TenantId | null> {
	return (req: express.Request, res: express.Response) => {
		const paramValue = requestValue.extractor(req);
		if (!paramValue) {
			res.status(400).send(`Missing required parameter tenantId`);
			return null;
		}
		return tenantId(paramValue);
	};
}

export function environmentIdParam(requestValue: RequestValueExtractor = path('envId')): ParamExtractor<EnvironmentId | null> {
	return (req: express.Request, res: express.Response) => {
		const paramValue = requestValue.extractor(req);
		if (!paramValue) {
			res.status(400).send(`Missing required parameter envId`);
			return null;
		}
		return environmentId(paramValue);
	};
}

export function tenantEnvironmentParam(
	tenantIdExtractor: RequestValueExtractor = path('tenantId'),
	environmentIdExtractor: RequestValueExtractor = path('envId')
): ParamExtractor<TenantEnvironment | null> {
	return (req: express.Request, res: express.Response) => {
		const tenantId = tenantIdParam(tenantIdExtractor)(req, res);
		if (!tenantId) {
			return null;
		}
		const environmentId = environmentIdParam(environmentIdExtractor)(req, res);
		if (!environmentId) {
			return null;
		}
		return tenantEnvironment(environmentId, tenantId);
	};
}

export function serviceIdParam(requestValue: RequestValueExtractor = path('serviceId')): ParamExtractor<ServiceId | null> {
	return (req: express.Request, res: express.Response) => {
		const paramValue = requestValue.extractor(req);
		if (!paramValue) {
			res.status(400).send(`Missing required parameter serviceId`);
			return null;
		}
		return serviceId(paramValue);
	};
}

export function orderIdParam(requestValue: RequestValueExtractor = path('orderId')): ParamExtractor<OrderId | null> {
	return (req: express.Request, res: express.Response) => {
		const paramValue = requestValue.extractor(req);
		if (!paramValue) {
			res.status(400).send(`Missing required parameter orderId`);
			return null;
		}
		return orderId(paramValue);
	};
}

export async function withErrorHandling(res: express.Response, f: () => Promise<void>): Promise<void> {
	try {
		return await f();
	} catch (e: unknown) {
		console.error(e);
		if (e instanceof Error) {
			res.status(500).send(e.message);
		} else {
			res.status(500).send('An unknown error occurred.');
		}
	}
}

export async function withThreeRequestParams<A, B, C>(
	req: express.Request,
	res: express.Response,
	aParam: ParamExtractor<A | null>,
	bParam: ParamExtractor<B | null>,
	cParam: ParamExtractor<C | null>,
	f: (a: A, b: B, c: C) => Promise<void>
): Promise<void> {
	const a = aParam(req, res);
	if (a === null) {
		return;
	}
	const b = bParam(req, res);
	if (b === null) {
		return;
	}
	const c = cParam(req, res);
	if (c === null) {
		return;
	}

	return await withErrorHandling(res, async () => await f(a, b, c));
}

export async function withEnviromentVariable(res: express.Response, environmentVariableName: string, f: (value: string) => Promise<void>): Promise<void> {
	const value = process.env[environmentVariableName];
	if (!value) {
		console.error(`Missing environment variable ${environmentVariableName}`);
		res.status(500).send();
		return;
	}
	return await f(value);
}

export async function withTwoRequestParams<A, B>(
	req: express.Request,
	res: express.Response,
	aParam: ParamExtractor<A | null>,
	bParam: ParamExtractor<B | null>,
	f: (a: A, b: B) => Promise<void>
): Promise<void> {
	const a = aParam(req, res);
	if (a === null) {
		return;
	}
	const b = bParam(req, res);
	if (b === null) {
		return;
	}
	return await withErrorHandling(res, async () => await f(a, b));
}

export async function withFourRequestParams<A, B, C, D>(
	req: express.Request,
	res: express.Response,
	aParam: ParamExtractor<A | null>,
	bParam: ParamExtractor<B | null>,
	cParam: ParamExtractor<C | null>,
	dParam: ParamExtractor<D | null>,
	f: (a: A, b: B, c: C, d: D) => Promise<void>
): Promise<void> {
	const a = aParam(req, res);
	if (a === null) {
		return;
	}
	const b = bParam(req, res);
	if (b === null) {
		return;
	}
	const c = cParam(req, res);
	if (c === null) {
		return;
	}
	const d = dParam(req, res);
	if (d === null) {
		return;
	}
	return await withErrorHandling(res, async () => await f(a, b, c, d));
}

export async function withFiveRequestParams<A, B, C, D, E>(
	req: express.Request,
	res: express.Response,
	aParam: ParamExtractor<A | null>,
	bParam: ParamExtractor<B | null>,
	cParam: ParamExtractor<C | null>,
	dParam: ParamExtractor<D | null>,
	eParam: ParamExtractor<E | null>,
	f: (a: A, b: B, c: C, d: D, e: E) => Promise<void>
): Promise<void> {
	const a = aParam(req, res);
	if (a === null) {
		return;
	}
	const b = bParam(req, res);
	if (b === null) {
		return;
	}
	const c = cParam(req, res);
	if (c === null) {
		return;
	}
	const d = dParam(req, res);
	if (d === null) {
		return;
	}
	const e = eParam(req, res);
	if (e === null) {
		return;
	}
	return await withErrorHandling(res, async () => await f(a, b, c, d, e));
}
