import { PrismaClient } from '@prisma/client';

let _prismaClient: PrismaClient;
export function prismaClient(): PrismaClient {
	if (!_prismaClient) {
		_prismaClient = new PrismaClient();
	}
	return _prismaClient;
}
