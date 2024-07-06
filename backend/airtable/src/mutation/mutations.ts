import {Prisma} from '@prisma/client';
import {stableJson} from '@breezbook/packages-core';

export type Entity = keyof Prisma.TypeMap<any>['model'];
export type CompositeKey = Record<string, string>;

export function compositeKey(...values: string[]): CompositeKey {
    if (values.length === 0) {
        throw new Error('Composite key must have at least one value')
    }
    if (values.length % 2 !== 0) {
        throw new Error('Composite key construction requires an even number of values')
    }
    const key: CompositeKey = {};
    for (let i = 0; i < values.length; i += 2) {
        key[values[i]] = values[i + 1];
    }
    return key;
}

export const compositeKeyFns = {
    toStableJson: (key: CompositeKey): string => {
        return stableJson(key)
    },
    keys: (key: CompositeKey): string[] => {
        return Object.keys(key);
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

export interface Upsert<TCreateInput = any, TUpdateInput = any, TWhereUniqueInput = any> {
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
