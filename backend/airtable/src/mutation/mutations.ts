import {Prisma} from '@prisma/client';
import {stableJson} from '@breezbook/packages-core';

export type Entity = keyof Prisma.TypeMap<any>['model'];
export type CompositeKey = Record<string, string>;

export const compositeKeyFns = {
    toString: (key: CompositeKey): string => {
        const sortedKeys = Object.keys(key).sort();
        return sortedKeys.map((k) => key[k]).join('-');
    }
};

export interface Create<TData> {
    _type: 'create';
    data: TData;
    entity: Entity;
    entityId: CompositeKey;
}

export interface Delete<TWhereUniqueInput> {
    _type: 'delete';
    where: TWhereUniqueInput;
    entity: Entity;
    entityId: CompositeKey;
}

export interface Update<TData, TWhereUniqueInput> {
    _type: 'update';
    data: TData;
    where: TWhereUniqueInput;
    entity: Entity;
    entityId: CompositeKey;
}

export interface Upsert<TCreateInput, TUpdateInput, TWhereUniqueInput> {
    _type: 'upsert';
    create: Create<TCreateInput>;
    update: Update<TUpdateInput, TWhereUniqueInput>;
}

// export function create(entity: Entity, entityId: CompositeKey, data: any): Create<any> {
//     return {_type: 'create', entity, entityId, data};
// }
//
// export function _delete(entity: Entity, entityId: CompositeKey): Delete<any> {
//     return {_type: 'delete', entity, entityId, where: {id: entityId}};
// }
//
// export function update(entity: Entity, entityId: CompositeKey, data: any): Update<any, any> {
//     return {_type: 'update', entity, entityId, where: {id: entityId}, data};
// }
//
// export function upsert(create: Create<any>, update: Update<any, any>): Upsert<any, any, any> {
//     return {_type: 'upsert', create, update};
// }

export type Mutation = Create<any> | Delete<any> | Update<any, any> | Upsert<any, any, any>;

export interface Mutations {
    _type: 'mutations';
    mutations: Mutation[];
}

export function mutations(mutations: Mutation[]): Mutations {
    return {_type: 'mutations', mutations};
}

export const mutationFns = {
    entity: function (m: Mutation): Entity {
        if (m._type === 'upsert') {
            return m.update.entity;
        }
        return m.entity;
    },
    entityIdAsStableJson: function (m: Mutation): string {
        const id = m._type === 'upsert' ? m.update.entityId : m.entityId;
        return stableJson(id);
    }
};
