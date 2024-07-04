import express from "express";
import {DbService, DbServiceImage, DbServiceLabel, DbServiceResourceRequirement} from "../../prisma/dbtypes.js";
import {anySuitableResourceSpec, Service, specificResourceSpec} from "@breezbook/backend-api-types";
import {mandatory} from "@breezbook/packages-core";
import {
    asHandler,
    EndpointDependencies,
    EndpointOutcome,
    expressBridge,
    httpResponseOutcome,
    languageIdParam,
    productionDeps, tenantEnvironmentParam
} from "../../infra/endpoint.js";
import {RequestContext} from "../../infra/http/expressHttp4t.js";
import {LanguageId, TenantEnvironment} from "@breezbook/packages-types";
import {responseOf} from "@breezbook/packages-http/dist/responses.js";

export type RequiredServiceData = DbService & { service_images: DbServiceImage[] } & { service_labels: DbServiceLabel[] }

export function toApiService(service: RequiredServiceData, serviceResourceRequirements: DbServiceResourceRequirement[], hasPricingRules: boolean): Service {
    const allImages = (service.service_images ?? []) as DbServiceImage[]
    const image = allImages.length > 0 ? allImages[0].public_image_url : 'https://picsum.photos/800/450'
    const priceAmount = (typeof service.price === "object" && "toNumber" in service.price) ? service.price.toNumber() : service.price;
    const resourceRequirements = serviceResourceRequirements.filter(r => r.service_id === service.id).map(srr => {
        if (srr.requirement_type === 'specific_resource') {
            return specificResourceSpec(srr.id, mandatory(srr.resource_id, `Service ${service.id} has a specific resource requirement with no resource id`))
        }
        return anySuitableResourceSpec(srr.id, mandatory(srr.resource_type, `Service ${service.id} has an any suitable resource requirement with no resource type`))
    });
    const firstLanguage = mandatory(service.service_labels[0], `Service ${service.id} has no labels`)

    return {
        id: service.id,
        name: firstLanguage.name,
        description: firstLanguage.description,
        slug: service.slug,
        priceWithNoDecimalPlaces: priceAmount,
        priceCurrency: service.price_currency,
        durationMinutes: service.duration_minutes,
        hasDynamicPricing: hasPricingRules,
        image,
        resourceRequirements
    };
}

function getServicesEndpoint(deps: EndpointDependencies, req: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, req).withTwoRequestParams(tenantEnvironmentParam(), languageIdParam(), getServices)
}

async function getServices(deps: EndpointDependencies, tenantEnvironment: TenantEnvironment, languageId: LanguageId): Promise<EndpointOutcome[]> {
    const prisma = deps.prisma
    const services = await prisma.services.findMany({
        where: {
            tenant_id: tenantEnvironment.tenantId.value,
            environment_id: tenantEnvironment.environmentId.value
        },
        include: {
            service_images: true,
            service_labels: {
                where: {
                    language_id: languageId.value
                }
            }
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
    const result = services.map(s => toApiService(s, serviceResourceRequirements, pricingRules.length > 0))
    return [httpResponseOutcome(responseOf(200, JSON.stringify(result)))]
}


export async function onGetServicesRequest(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, getServicesEndpoint, req, res)
}
