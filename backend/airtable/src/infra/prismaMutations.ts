export interface PrismaUpdate<TDelegate, TData, TWhereUniqueInput> {
	_type: 'prisma.update';
	delegate: TDelegate;
	data: TData;
	where: TWhereUniqueInput;
}

export function prismaUpdate<TDelegate, TData, TWhereUniqueInput>(
	delegate: TDelegate,
	data: TData,
	where: TWhereUniqueInput
): PrismaUpdate<TDelegate, TData, TWhereUniqueInput> {
	return { _type: 'prisma.update', delegate, data, where };
}

export interface PrismaUpsert<TDelegate, TCreateInput, TUpdateInput, TWhereUniqueInput> {
	_type: 'prisma.upsert';
	delegate: TDelegate;
	where: TWhereUniqueInput;
	create: TCreateInput;
	update: TUpdateInput;
}

export function prismaUpsert<TDelegate, TCreateInput, TUpdateInput, TWhereUniqueInput>(
	delegate: TDelegate,
	where: TWhereUniqueInput,
	create: TCreateInput,
	update: TUpdateInput
): PrismaUpsert<TDelegate, TCreateInput, TUpdateInput, TWhereUniqueInput> {
	return { _type: 'prisma.upsert', delegate, where, create, update };
}

export interface PrismaCreate<TDelegate, TCreateInput> {
	_type: 'prisma.create';
	delegate: TDelegate;
	data: TCreateInput;
}

export function prismaCreate<TDelegate, TCreateInput>(delegate: TDelegate, data: TCreateInput): PrismaCreate<TDelegate, TCreateInput> {
	return { _type: 'prisma.create', delegate, data };
}

export interface PrismaDelete<TDelegate, TWhereUniqueInput> {
	_type: 'prisma.delete';
	delegate: TDelegate;
	where: TWhereUniqueInput;
}

export function prismaDelete<TDelegate, TWhereUniqueInput>(delegate: TDelegate, where: TWhereUniqueInput): PrismaDelete<TDelegate, TWhereUniqueInput> {
	return { _type: 'prisma.delete', delegate, where };
}

export type PrismaMutation = PrismaUpdate<any, any, any> | PrismaUpsert<any, any, any, any> | PrismaCreate<any, any> | PrismaDelete<any, any>;

export interface PrismaMutations {
	_type: 'prisma.mutations';
	mutations: PrismaMutation[];
}

export function prismaMutations(mutations: PrismaMutation[]): PrismaMutations {
	return { _type: 'prisma.mutations', mutations };
}

export interface PrismaUpdates {
	_type: 'prisma.updates';
	updates: PrismaUpdate<any, any, any>[];
}

export function prismaUpdates(updates: PrismaUpdate<any, any, any>[]): PrismaUpdates {
	return { _type: 'prisma.updates', updates };
}

export function toPrismaPromises(updates: PrismaUpdate<any, any, any>[]) {
	return updates.map((update) => update.delegate.update({ data: update.data, where: update.where }));
}

export function prismaMutationToPromise(mutation: PrismaMutation) {
	switch (mutation._type) {
		case 'prisma.update':
			return mutation.delegate.update({ data: mutation.data, where: mutation.where });
		case 'prisma.upsert':
			return mutation.delegate.upsert({ where: mutation.where, create: mutation.create, update: mutation.update });
		case 'prisma.create':
			return mutation.delegate.create({ data: mutation.data });
		case 'prisma.delete':
			return mutation.delegate.delete({ where: mutation.where });
	}
}
