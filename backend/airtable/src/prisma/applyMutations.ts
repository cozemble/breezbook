import {PrismaClient} from "@prisma/client";
import {TenantEnvironment} from "@breezbook/packages-types";
import {Mutation, mutationFns} from "../mutation/mutations.js";
import {prismaMutationToPromise} from "../infra/prismaMutations.js";

export async function applyMutations(prisma: PrismaClient, tenantEnvironment: TenantEnvironment, mutations: Mutation[]): Promise<void> {
    const outcomeMutations = mutations.map((mutation) => prismaMutationToPromise(prisma, mutation));
    const storeEvents = mutations.map((m) => storeEvent(tenantEnvironment, prisma, m));
    await prisma.$transaction([...outcomeMutations, ...storeEvents]);

}

function storeEvent(tenantEnvironment: TenantEnvironment, prisma: PrismaClient, mutation: Mutation) {
    return prisma.mutation_events.create({
        data: {
            tenant_id: tenantEnvironment.tenantId.value,
            environment_id: tenantEnvironment.environmentId.value,
            event_type: mutation._type,
            entity_type: mutationFns.entity(mutation),
            entity_id: mutationFns.entityIdAsStableJson(mutation),
            event_data: mutation as any
        }
    });
}
