import { PrismaClient } from '@breezbook/backend-database';

let _prismaClient: PrismaClient;
export function prismaClient(): PrismaClient {
	if (!_prismaClient) {
		_prismaClient = new PrismaClient();
	}
	return _prismaClient;
}
