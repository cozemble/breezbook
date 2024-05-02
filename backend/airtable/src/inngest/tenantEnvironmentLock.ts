import {PrismaClient} from "@prisma/client";

export async function acquireLock(prisma: PrismaClient, tenantId: string, environmentId: string): Promise<boolean> {
    try {
        await prisma.locks.create({
            data: {
                lock_key: `${tenantId}-${environmentId}`,
            }
        });
        return true
    } catch (error: any) {
        if (error.code === "P2002") {
            // Unique constraint violation error (lock already exists)
            return false;
        }
        throw error;
    }
}

export async function releaseLock(prisma: PrismaClient, tenantId: string, environmentId: string): Promise<void> {
    await prisma.locks.delete({
        where: {
            lock_key: `${tenantId}-${environmentId}`
        }
    });
}