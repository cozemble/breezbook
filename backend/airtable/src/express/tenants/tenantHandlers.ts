import express from "express";
import {
    DbForm,
    DbFormLabel,
    DbLocation,
    DbPricingRule,
    DbServiceLocation,
    DbServiceResourceRequirement,
    DbTenant,
    DbTenantBranding,
    DbTenantBrandingLabel,
    DbTenantImage,
    DbTenantSettings
} from "../../prisma/dbtypes.js";
import {Tenant} from "@breezbook/backend-api-types";
import {PrismaClient} from "@prisma/client";
import {EnvironmentId, JsonSchemaFormLabels, LanguageId, mandatory} from "@breezbook/packages-types";
import {RequiredServiceData, toApiService} from "../services/serviceHandlers.js";
import {
    asHandler,
    EndpointDependencies,
    EndpointOutcome,
    environmentIdParam,
    expressBridge,
    httpResponseOutcome,
    languageIdParam,
    paramExtractor,
    ParamExtractor,
    productionDeps,
    query,
    RequestValueExtractor
} from "../../infra/endpoint.js";
import {RequestContext} from "../../infra/http/expressHttp4t.js";
import {responseOf} from "@breezbook/packages-http/dist/responses.js";
import {toDomainForm} from "../../prisma/dbToDomain.js";

type DbTenantAndStuff = DbTenant & {
    tenant_images: DbTenantImage[],
    locations: DbLocation[],
    tenant_branding: (DbTenantBranding & { tenant_branding_labels: DbTenantBrandingLabel[] })[],
    services: RequiredServiceData[],
    service_locations: DbServiceLocation[],
    service_resource_requirements: DbServiceResourceRequirement[],
    pricing_rules: DbPricingRule[],
    forms: (DbForm & { form_labels: DbFormLabel[] })[],
    tenant_settings: DbTenantSettings[]
};

function toApiTenant(tenant: DbTenantAndStuff): Tenant {
    const tenantImages: DbTenantImage[] = tenant.tenant_images ?? [];
    const branding = mandatory(tenant.tenant_branding[0], `Expected exactly one branding record for tenant, got ${tenant.tenant_branding.length}`)
    const brandingLabels = mandatory(branding.tenant_branding_labels[0], `Expected exactly one branding label record for tenant, got ${branding.tenant_branding_labels.length}`)
    const tenantSettings = mandatory(tenant.tenant_settings[0], `Expected exactly one settings record for tenant, got ${tenant.tenant_settings.length}`)
    const customerForm = tenant.forms.find(f => f.id === tenantSettings.customer_form_id) ?? null;
    return {
        id: tenant.tenant_id,
        name: tenant.name,
        slug: tenant.slug,
        description: brandingLabels.description,
        heading: brandingLabels.headline,
        heroImage: tenantImages.length > 0 ? tenantImages[0].public_image_url : 'https://picsum.photos/800/450',
        locations: tenant.locations.map(l => ({id: l.id, slug: l.slug, name: l.name})),
        theme: branding.theme,
        services: tenant.services.map(s => toApiService(s, tenant.service_resource_requirements, tenant.pricing_rules.length > 0)),
        serviceLocations: tenant.service_locations.map(sl => ({serviceId: sl.service_id, locationId: sl.location_id})),
        customerForm: customerForm ? toDomainForm(customerForm) : null,
        forms: tenant.forms.map(dbForm => {
            const labels = mandatory(dbForm.form_labels[0], `Expected exactly one form label record for form ${dbForm.id}, got ${dbForm.form_labels.length}`)
            const domainLabels = labels.labels as any as JsonSchemaFormLabels;
            if (domainLabels._type !== "json.schema.form.labels") {
                throw new Error(`Expected json.schema.form.labels, got ${domainLabels._type}`)
            }
            return ({form: toDomainForm(dbForm), labels: domainLabels});
        })
    }
}

function slugQueryParam(requestValue: RequestValueExtractor = query('slug')): ParamExtractor<string> {
    return paramExtractor('slug', requestValue.extractor, (s) => s);
}

async function findTenantAndLocations(prisma: PrismaClient, slug: string, environment_id: string, language_id: string): Promise<DbTenantAndStuff | null> {
    const tenant = await prisma.tenants.findUnique({
        where: {
            slug
        },
        include: {
            tenant_images: {
                where: {
                    environment_id
                }
            },
            tenant_settings: {
                where: {
                    environment_id
                }
            },
            forms: {
                where: {
                    environment_id
                },
                include: {
                    form_labels: {
                        where: {
                            language_id
                        }
                    }
                }
            },
            services: {
                where: {
                    environment_id
                },
                include: {
                    service_images: true,
                    service_labels: {
                        where: {
                            language_id
                        }
                    }
                }
            },
            service_locations: {
                where: {
                    environment_id
                }
            },
            service_resource_requirements: {
                where: {
                    environment_id
                }
            },
            tenant_branding: {
                where: {
                    environment_id
                },
                include: {
                    tenant_branding_labels: {
                        where: {
                            language_id
                        }
                    }
                }
            },
            locations: {
                where: {
                    environment_id
                }
            },
            pricing_rules: {
                where: {
                    environment_id
                }
            },
        }
    });
    if (tenant) {
        for (const service of tenant.services) {
            if (service.service_labels.length === 0) {
                throw new Error(`No service label found for service ${service.id}, language ${language_id}`)
            }
        }
    }
    return tenant
}

export async function onGetTenantRequestExpress(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, onGetTenantRequestEndpoint, req, res)
}

export async function onGetTenantRequestEndpoint(deps: EndpointDependencies, req: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, req).withThreeRequestParams(environmentIdParam(), slugQueryParam(), languageIdParam(), getTenant);
}

async function getTenant(deps: EndpointDependencies, environmentId: EnvironmentId, slug: string, languageId: LanguageId): Promise<EndpointOutcome[]> {
    const tenant = await findTenantAndLocations(deps.prisma, slug, environmentId.value, languageId.value);
    if (!tenant) {
        return [httpResponseOutcome(responseOf(404))];
    }
    return [httpResponseOutcome(responseOf(200, JSON.stringify(toApiTenant(tenant))))]

}
