export interface PrismaUpdate<TDelegate, TData, TWhereUniqueInput> {
	_type: 'prisma.update';
	delegate: TDelegate;
	data: TData;
	where: TWhereUniqueInput;
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
