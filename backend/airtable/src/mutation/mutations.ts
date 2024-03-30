import { Prisma } from '@prisma/client';
import { Id } from '@breezbook/packages-core';

export type Entity = keyof Prisma.TypeMap<any>['model'];

export interface Create<TData> {
	_type: 'create';
	data: TData;
	entity: Entity;
	entityId: Id;
}

export interface Delete<TWhereUniqueInput> {
	_type: 'delete';
	where: TWhereUniqueInput;
	entity: Entity;
	entityId: Id;
}

export interface Update<TData, TWhereUniqueInput> {
	_type: 'update';
	data: TData;
	where: TWhereUniqueInput;
	entity: Entity;
	entityId: Id;
}

export interface Upsert<TCreateInput, TUpdateInput, TWhereUniqueInput> {
	_type: 'upsert';
	create: Create<TCreateInput>;
	update: Update<TUpdateInput, TWhereUniqueInput>;
}

export type Mutation = Create<any> | Delete<any> | Update<any, any> | Upsert<any, any, any>;
export interface Mutations {
	_type: 'mutations';
	mutations: Mutation[];
}

export function mutations(mutations: Mutation[]): Mutations {
	return { _type: 'mutations', mutations };
}

export const mutationFns = {
	entity: function (m: Mutation): Entity {
		if (m._type === 'upsert') {
			return m.update.entity;
		}
		return m.entity;
	},
	entityId: function (m: Mutation): Id {
		if (m._type === 'upsert') {
			return m.update.entityId;
		}
		return m.entityId;
	}
};