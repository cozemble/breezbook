import {prismaClient} from "../prisma/client.js";


export class SimpleKvStore {
    constructor(private readonly prisma = prismaClient()) {
    }

    async get(key: string): Promise<string | null> {
        const maybeValue = await this.prisma.simple_kv_store.findUnique({
            where: {
                key: key
            }
        });
        const now = new Date();
        if (maybeValue && (maybeValue.expires_at ?? now).getTime() > now.getTime()) {
            return maybeValue.value;
        }
        return null;
    }

    async set(key: string, value: string, expiresAt: Date | null = null): Promise<void> {
        await this.prisma.simple_kv_store.upsert({
            where: {
                key: key
            },
            update: {
                value: value,
                expires_at: expiresAt
            },
            create: {
                key: key,
                value: value,
                expires_at: expiresAt
            }
        });
    }

    async delete(key: string): Promise<void> {
        await this.prisma.simple_kv_store.delete({
            where: {
                key: key
            }
        });
    }
}

export function simpleKvStore(): SimpleKvStore {
    return new SimpleKvStore();
}