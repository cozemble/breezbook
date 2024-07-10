import express from "express";
import {
    DbForm,
    DbService, DbServiceForm,
    DbServiceImage,
    DbServiceLabel,
    DbServiceOption,
    DbServiceOptionForm,
    DbServiceOptionImage,
    DbServiceOptionLabel,
    DbServiceOptionResourceRequirement,
    DbServiceResourceRequirement,
    DbServiceTimeslot
} from "../../prisma/dbtypes.js";
import {anySuitableResourceSpec, Service, ServiceOption, specificResourceSpec} from "@breezbook/backend-api-types";
import {mandatory} from "@breezbook/packages-core";
import {
    asHandler,
    EndpointDependencies,
    EndpointOutcome,
    expressBridge,
    httpResponseOutcome,
    languageIdParam,
    productionDeps,
    tenantEnvironmentParam
} from "../../infra/endpoint.js";
import {RequestContext} from "../../infra/http/expressHttp4t.js";
import {formId, LanguageId, TenantEnvironment} from "@breezbook/packages-types";
import {responseOf} from "@breezbook/packages-http/dist/responses.js";

export type RequiredServiceOptionData = DbServiceOption & {
    service_option_images: DbServiceOptionImage[];
    service_option_resource_requirements: DbServiceOptionResourceRequirement[];
    service_option_labels: DbServiceOptionLabel[];
    service_option_forms: DbServiceOptionForm[];
}

export type RequiredServiceData = DbService & {
    service_images: DbServiceImage[];
    service_labels: DbServiceLabel[];
    service_resource_requirements: DbServiceResourceRequirement[];
    service_service_options: {
        service_options: RequiredServiceOptionData;
    }[];
    service_time_slots: DbServiceTimeslot[];
    service_forms: DbServiceForm[];
};

export function toApiServiceOption(so: RequiredServiceOptionData): ServiceOption {
    const firstLabel = mandatory(so.service_option_labels[0], `Service option has no labels`)
    const priceAmount = (typeof so.price === "object" && "toNumber" in so.price) ? so.price.toNumber() : so.price;
    return {
        id: so.id,
        name: firstLabel.name,
        description: firstLabel.description,
        image: so.service_option_images.length > 0 ? so.service_option_images[0].public_image_url : 'https://picsum.photos/800/450',
        priceWithNoDecimalPlaces: priceAmount,
        priceCurrency: so.price_currency,
        durationMinutes: so.duration_minutes,
        resourceRequirements: so.service_option_resource_requirements.map(sorr => {
            if (sorr.requirement_type === 'specific_resource') {
                return specificResourceSpec(sorr.id, mandatory(sorr.resource_id, `Service option ${so.id} has a specific resource requirement with no resource id`))
            }
            return anySuitableResourceSpec(sorr.id, mandatory(sorr.resource_type, `Service option ${so.id} has an any suitable resource requirement with no resource type`))
        }),
        requiresQuantity: so.requires_quantity,
        forms: so.service_option_forms.map(f => formId(f.form_id))
    }
}

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
    const serviceOptions = service.service_service_options.flatMap(ss => ss.service_options).map(toApiServiceOption)
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
        resourceRequirements,
        serviceOptions,
        forms: service.service_forms.map(f => formId(f.form_id))
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
            },
            service_time_slots: true,
            service_resource_requirements: true,
            service_forms: true,
            service_service_options: {
                include: {
                    service_options: {
                        include: {
                            service_option_labels: {
                                where: {
                                    language_id: languageId.value
                                }
                            },
                            service_option_images: true,
                            service_option_resource_requirements: true,
                            service_option_forms: true
                        }
                    }
                }
            },
        }
    });

    for (const service of services) {
        if (service.service_labels.length === 0) {
            return [httpResponseOutcome(responseOf(404, `No service label found for service ${service.id}, language ${languageId.value}`))]
        }
    }
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
    return [httpResponseOutcome(responseOf(200, JSON.stringify(result), ['Content-Type', 'application/json']))]
}


export async function onGetServicesRequest(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, getServicesEndpoint, req, res)
}
