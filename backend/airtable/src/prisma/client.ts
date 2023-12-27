import { PrismaClient} from "@prisma/client"

// export const prisma = new PrismaClient();
let _prismaClient: PrismaClient
export function prismaClient() {
	if (!_prismaClient) {
		_prismaClient = new PrismaClient()
	}
	return _prismaClient
}