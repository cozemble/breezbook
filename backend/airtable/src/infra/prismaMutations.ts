import { Create, Delete, Update, Upsert } from '../mutation/mutations.js';

export interface PrismaUpdate<TDelegate, TData, TWhereUniqueInput> {
	_type: 'prisma.update';
	delegate: TDelegate;
	update: Update<TData, TWhereUniqueInput>;
}

export interface PrismaUpsert<TDelegate, TCreateInput, TUpdateInput, TWhereUniqueInput> {
	_type: 'prisma.upsert';
	delegate: TDelegate;
	upsert: Upsert<TCreateInput, TUpdateInput, TWhereUniqueInput>;
}

export interface PrismaCreate<TDelegate, TCreateInput> {
	_type: 'prisma.create';
	delegate: TDelegate;
	create: Create<TCreateInput>;
}

export interface PrismaDelete<TDelegate, TWhereUniqueInput> {
	_type: 'prisma.delete';
	delegate: TDelegate;
	_delete: Delete<TWhereUniqueInput>;
}

export type PrismaMutation = PrismaUpdate<any, any, any> | PrismaUpsert<any, any, any, any> | PrismaCreate<any, any> | PrismaDelete<any, any>;

export interface PrismaMutations {
	_type: 'prisma.mutations';
	mutations: PrismaMutation[];
}

export function prismaMutations(mutations: PrismaMutation[]): PrismaMutations {
	return { _type: 'prisma.mutations', mutations };
}

export function prismaMutationToPromise(mutation: PrismaMutation) {
	switch (mutation._type) {
		case 'prisma.update':
			return mutation.delegate.update({ data: mutation.update.data, where: mutation.update.where });
		case 'prisma.upsert':
			return mutation.delegate.upsert({ where: mutation.upsert.update.where, create: mutation.upsert.create.data, update: mutation.upsert.update.data });
		case 'prisma.create':
			return mutation.delegate.create({ data: mutation.create.data });
		case 'prisma.delete':
			return mutation.delegate.delete({ where: mutation._delete.where });
	}
}
