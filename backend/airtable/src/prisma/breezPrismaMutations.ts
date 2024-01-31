import { PrismaUpdate } from '../infra/prismaMutations.js';
import { Prisma, PrismaClient } from '@prisma/client';

type UpdateCancellationGrant = PrismaUpdate<
	Prisma.cancellation_grantsDelegate,
	Prisma.cancellation_grantsUpdateArgs['data'],
	Prisma.cancellation_grantsWhereUniqueInput
>;

type UpdateBooking = PrismaUpdate<Prisma.bookingsDelegate, Prisma.bookingsUpdateArgs['data'], Prisma.bookingsWhereUniqueInput>;

export function updateCancellationGrant(
	prisma: PrismaClient,
	data: Prisma.cancellation_grantsUpdateArgs['data'],
	where: Prisma.cancellation_grantsWhereUniqueInput
): UpdateCancellationGrant {
	return {
		_type: 'prisma.update',
		delegate: prisma.cancellation_grants,
		data: data,
		where: where
	};
}

export function updateBooking(prisma: PrismaClient, data: Prisma.bookingsUpdateArgs['data'], where: Prisma.bookingsWhereUniqueInput): UpdateBooking {
	return {
		_type: 'prisma.update',
		delegate: prisma.bookings,
		data: data,
		where: where
	};
}
