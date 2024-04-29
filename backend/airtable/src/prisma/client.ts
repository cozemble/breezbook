import { PrismaClient } from '@prisma/client';

let _prismaClient: PrismaClient;
export function prismaClient(): PrismaClient {
	if (!_prismaClient) {
		_prismaClient = new PrismaClient({
			log: ['info'],
		});
		console.log('Prisma client created using database url: ' + process.env.DATABASE_URL);
	}
	return _prismaClient;
}
