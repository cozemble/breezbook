import { Entity, Mutation, mutationFns } from '../mutation/mutations.js';
import { PrismaClient } from '@prisma/client';
import { mandatory } from '@breezbook/packages-core';

function delegateForEntity(prisma: PrismaClient, entity: Entity): any {
	return mandatory(prisma[entity], `Unknown entity ${entity}`);
}

export function prismaMutationToPromise(prisma: PrismaClient, mutation: Mutation) {
	const entity = mutationFns.entity(mutation);
	const delegate = delegateForEntity(prisma, entity);
	switch (mutation._type) {
		case 'update':
			return delegate.update({ data: mutation.data, where: mutation.where });
		case 'upsert':
			return delegate.upsert({
				where: mutation.update.where,
				create: mutation.create.data,
				update: mutation.update.data
			});
		case 'create':
			return delegate.create({ data: mutation.data });
		case 'delete':
			return delegate.delete({ where: mutation.where });
	}
}
