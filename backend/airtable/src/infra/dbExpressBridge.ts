import { TenantEnvironment } from '@breezbook/packages-types';
import { prismaClient } from '../prisma/client.js';
import { ParamExtractor, tenantEnvironmentParam } from './functionalExpress.js';
import { PrismaClient } from '@prisma/client';
import express from 'express';

export type DbResourceFinder<V> = (prisma: PrismaClient, tenantEnvironment: TenantEnvironment) => Promise<V | null>;

export interface NamedDbResourceFinder<V> {
	name: string;
	finder: DbResourceFinder<V>;
}

export function namedDbResourceFinder<V>(name: string, finder: DbResourceFinder<V>): NamedDbResourceFinder<V> {
	return { name, finder };
}

export class DbExpressBridge {
	constructor(
		private readonly res: express.Response,
		public readonly tenantEnvironment: TenantEnvironment,
		public readonly prisma: PrismaClient = prismaClient()
	) {}

	async withResource<V, R>(namedFinder: NamedDbResourceFinder<V>, fn: (theResource: V) => Promise<R>) {
		const theResource = await namedFinder.finder(this.prisma, this.tenantEnvironment);
		if (!theResource) {
			this.res.status(404).send(`No such ${namedFinder.name} found`);
			return;
		}
		return fn(theResource);
	}
}

export function dbExpressBridge(res: express.Response, tenantEnvironment: TenantEnvironment): DbExpressBridge {
	return new DbExpressBridge(res, tenantEnvironment);
}

export function dbBridge(): ParamExtractor<DbExpressBridge | null> {
	return (req: express.Request, res: express.Response) => {
		const tenantEnvironment = tenantEnvironmentParam()(req, res);
		if (!tenantEnvironment) {
			return null;
		}
		return dbExpressBridge(res, tenantEnvironment);
	};
}
