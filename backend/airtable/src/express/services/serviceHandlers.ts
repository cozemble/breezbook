import express from "express";
import {tenantEnvironmentParam, withOneRequestParam} from "../../infra/functionalExpress.js";
import {prismaClient} from "../../prisma/client.js";
import {DbService, DbServiceImage, DbServiceResourceRequirement} from "../../prisma/dbtypes.js";
import {anySuitableResource, Service, specificResource} from "@breezbook/backend-api-types";
import {mandatory} from "@breezbook/packages-core";

export function toApiService(service: DbService, serviceResourceRequirements: DbServiceResourceRequirement[], hasPricingRules: boolean): Service {
    const allImages = ((service as any).service_images ?? []) as DbServiceImage[]
    const image = allImages.length > 0 ? allImages[0].public_image_url : 'https://picsum.photos/800/450'
    const priceAmount = (typeof service.price === "object" && "toNumber" in service.price) ? service.price.toNumber() : service.price;
    const resourceRequirements = serviceResourceRequirements.filter(r => r.service_id === service.id).map(srr => {
        if(srr.requirement_type === 'specific_resource') {
            return specificResource(srr.id, mandatory(srr.resource_id,`Service ${service.id} has a specific resource requirement with no resource id`))
        }
        return anySuitableResource(srr.id, mandatory(srr.resource_type,`Service ${service.id} has an any suitable resource requirement with no resource type`))
    });

    return {
        id: service.id,
        name: service.name,
        description: service.description,
        slug: service.slug,
        priceWithNoDecimalPlaces: priceAmount,
        priceCurrency: service.price_currency,
        durationMinutes: service.duration_minutes,
        hasDynamicPricing: hasPricingRules,
        image,
        resourceRequirements
    };
}

export async function onGetServicesRequest(req: express.Request, res: express.Response): Promise<void> {
    await withOneRequestParam(req, res, tenantEnvironmentParam(), async (tenantEnvironment) => {
        const prisma = prismaClient();
        const services = await prisma.services.findMany({
            where: {
                tenant_id: tenantEnvironment.tenantId.value,
                environment_id: tenantEnvironment.environmentId.value
            },
            include: {
                service_images: true
            }
        });
        const serviceResourceRequirements = await prisma.service_resource_requirements.findMany({
            where: {
                tenant_id: tenantEnvironment.tenantId.value,
                environment_id: tenantEnvironment.environmentId.value
            }
        });
        const pricingRules = await prisma.pricing_rules.findMany({
            where: {
                tenant_id: tenantEnvironment.tenantId.value,
                environment_id: tenantEnvironment.environmentId.value
            }
        });
        const result = services.map(s => toApiService(s, serviceResourceRequirements,pricingRules.length > 0),)
        res.status(200).send(result)
    });
}
