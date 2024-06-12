import express from 'express';
import {tenantEnvironmentParam, withOneRequestParam} from '../../infra/functionalExpress.js';
import {prismaClient} from '../../prisma/client.js';
import {upsertAddOn, upsertService, upsertServiceResourceRequirement} from '../../prisma/breezPrismaMutations.js';
import {compositeKeyFns} from "../../mutation/mutations.js";
import {PrismaClient} from "@prisma/client";
import {TenantEnvironment} from '@breezbook/packages-core';

export async function publishReferenceData(prisma: PrismaClient, tenantEnvironment: TenantEnvironment) {
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
    const serviceRequirements = await prisma.service_resource_requirements.findMany({
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
            }
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
                requires_time_slot: service.requires_time_slot
            }
        )
    );
    const serviceRequirementsAsMutations = serviceRequirements.map(srr => upsertServiceResourceRequirement({
        id: srr.id,
        tenant_id: srr.tenant_id,
        environment_id: srr.environment_id,
        service_id: srr.service_id,
        requirement_type: srr.requirement_type,
        resource_type: srr.resource_type,
        resource_id: srr.resource_id,
    }))
    const allMutations = [...addOnsAsMutations, ...servicesAsMutations, ...serviceRequirementsAsMutations];
    const mutationInserts = allMutations.map((m) =>
        prisma.mutation_events.create({
            data: {
                tenant_id: tenantEnvironment.tenantId.value,
                environment_id: tenantEnvironment.environmentId.value,
                event_type: m._type,
                entity_type: m.create.entity,
                entity_id: compositeKeyFns.toStableJson(m.create.entityId),
                event_data: m as any
            }
        })
    );
    await prisma.$transaction(mutationInserts);
}

export async function onPublishReferenceDataAsMutationEvents(req: express.Request, res: express.Response): Promise<void> {
    await withOneRequestParam(req, res, tenantEnvironmentParam(), async (tenantEnvironment) => {
        await publishReferenceData(prismaClient(), tenantEnvironment);
        res.status(200).send();
    });
}
