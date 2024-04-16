import express from "express";
import {tenantEnvironmentParam, withOneRequestParam} from "../../infra/functionalExpress.js";
import {prismaClient} from "../../prisma/client.js";
import {DbService, DbServiceImage} from "../../prisma/dbtypes.js";
import {Service} from "@breezbook/backend-api-types";

function toApiService(service: DbService, hasPricingRules: boolean): Service {
    const allImages = ((service as any).service_images ?? []) as DbServiceImage[]
    const image = allImages.length > 0 ? allImages[0].public_image_url : 'https://picsum.photos/800/450'
    return {
        id: service.id,
        name: service.name,
        description: service.description,
        slug: service.service_id,
        priceWithNoDecimalPlaces: service.price.toNumber(),
        priceCurrency: service.price_currency,
        durationMinutes: service.duration_minutes,
        hasDynamicPricing: hasPricingRules,
        image
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
        const pricingRules = await prisma.pricing_rules.findMany({
            where: {
                tenant_id: tenantEnvironment.tenantId.value,
                environment_id: tenantEnvironment.environmentId.value
            }
        });
        const result = services.map(s => toApiService(s, pricingRules.length > 0),)
        res.status(200).send(result)
    });
}
