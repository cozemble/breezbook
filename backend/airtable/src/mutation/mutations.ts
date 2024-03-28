import { Prisma } from '@prisma/client';
export interface Create<TData> {
	_type: 'create';
	data: TData;
}

export interface Delete<TWhereUniqueInput> {
	_type: 'delete';
	where: TWhereUniqueInput;
}

export interface Update<TData, TWhereUniqueInput> {
	_type: 'update';
	data: TData;
	where: TWhereUniqueInput;
}

export interface Upsert<TCreateInput, TUpdateInput, TWhereUniqueInput> {
	_type: 'upsert';
	create: Create<TCreateInput>;
	update: Update<TUpdateInput, TWhereUniqueInput>;
}

export type Mutation = Create<any> | Delete<any> | Update<any, any> | Upsert<any, any, any>;
