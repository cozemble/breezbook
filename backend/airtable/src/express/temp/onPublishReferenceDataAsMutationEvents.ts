import express from 'express';
import {tenantEnvironmentParam, withOneRequestParam} from '../../infra/functionalExpress.js';
import {prismaClient} from '../../prisma/client.js';
import {upsertAddOn, upsertService} from '../../prisma/breezPrismaMutations.js';

export async function onPublishReferenceDataAsMutationEvents(req: express.Request, res: express.Response): Promise<void> {
    await withOneRequestParam(req, res, tenantEnvironmentParam(), async (tenantEnvironment) => {
        const prisma = prismaClient();
        const addOns = await prisma.add_on.findMany({
            where: {
                tenant_id: tenantEnvironment.tenantId.value,
                environment_id: tenantEnvironment.environmentId.value
            }
        });
        const services = await prisma.services.findMany({
            where: {
                tenant_id: tenantEnvironment.tenantId.value,
                environment_id: tenantEnvironment.environmentId.value
            }
        });
        const addOnsAsMutations = addOns.map((addOn) =>
            upsertAddOn(
                {
                    id: addOn.id,
                    tenant_id: addOn.tenant_id,
                    environment_id: addOn.environment_id,
                    name: addOn.name,
                    description: addOn.description,
                    price: addOn.price,
                    price_currency: addOn.price_currency,
                    expect_quantity: addOn.expect_quantity
                },
                {
                    tenant_id: addOn.tenant_id,
                    environment_id: addOn.environment_id,
                    name: addOn.name,
                    description: addOn.description,
                    price: addOn.price,
                    price_currency: addOn.price_currency,
                    expect_quantity: addOn.expect_quantity
                },
                {id: addOn.id}
            )
        );
        const servicesAsMutations = services.map((service) =>
            upsertService(
                {
                    id: service.id,
                    tenant_id: service.tenant_id,
                    environment_id: service.environment_id,
                    slug: service.slug,
                    name: service.name,
                    description: service.description,
                    duration_minutes: service.duration_minutes,
                    price: service.price,
                    price_currency: service.price_currency,
                    permitted_add_on_ids: service.permitted_add_on_ids,
                    resource_types_required: service.resource_types_required,
                    requires_time_slot: service.requires_time_slot
                },
                {
                    tenant_id: service.tenant_id,
                    environment_id: service.environment_id,
                    slug: service.slug,
                    name: service.name,
                    description: service.description,
                    duration_minutes: service.duration_minutes,
                    price: service.price,
                    price_currency: service.price_currency,
                    permitted_add_on_ids: service.permitted_add_on_ids,
                    resource_types_required: service.resource_types_required,
                    requires_time_slot: service.requires_time_slot
                },
                {
                    id: service.id
                }
            )
        );
        const allMutations = [...addOnsAsMutations, ...servicesAsMutations];
        const mutationInserts = allMutations.map((m) =>
            prisma.mutation_events.create({
                data: {
                    tenant_id: tenantEnvironment.tenantId.value,
                    environment_id: tenantEnvironment.environmentId.value,
                    event_type: m._type,
                    entity_type: m.create.entity,
                    entity_id: m.create.entityId.value,
                    event_data: m as any
                }
            })
        );
        await prisma.$transaction(mutationInserts);
        res.status(200).send();
    });
}
