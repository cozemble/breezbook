import express from "express";
import {
    DbLocation,
    DbPricingRule,
    DbService,
    DbServiceLocation,
    DbServiceResourceRequirement,
    DbTenant,
    DbTenantBranding,
    DbTenantImage
} from "../../prisma/dbtypes.js";
import {Tenant} from "@breezbook/backend-api-types";
import {PrismaClient} from "@prisma/client";
import {EnvironmentId, mandatory} from "@breezbook/packages-core";
import {toApiService} from "../services/serviceHandlers.js";
import {
    asHandler,
    EndpointDependencies,
    EndpointOutcome,
    environmentIdParam,
    expressBridge,
    httpResponseOutcome,
    paramExtractor,
    ParamExtractor,
    productionDeps,
    query,
    RequestValueExtractor
} from "../../infra/endpoint.js";
import {responseOf} from "@http4t/core/responses.js";
import {RequestContext} from "../../infra/http/expressHttp4t.js";

type DbTenantAndStuff = DbTenant & {
    tenant_images: DbTenantImage[],
    locations: DbLocation[],
    tenant_branding: DbTenantBranding[],
    services: DbService[],
    service_locations: DbServiceLocation[],
    service_resource_requirements: DbServiceResourceRequirement[],
    pricing_rules: DbPricingRule[]
};

function toApiTenant(tenant: DbTenantAndStuff): Tenant {
    const tenantImages: DbTenantImage[] = tenant.tenant_images ?? [];
    const branding = mandatory(tenant.tenant_branding[0], `Expected exactly one branding record for tenant, got ${tenant.tenant_branding.length}`)
    return {
        id: tenant.tenant_id,
        name: tenant.name,
        slug: tenant.slug,
        description: branding.description,
        heading: branding.headline,
        heroImage: tenantImages.length > 0 ? tenantImages[0].public_image_url : 'https://picsum.photos/800/450',
        locations: tenant.locations.map(l => ({id: l.id, slug: l.slug, name: l.name})),
        theme: branding.theme,
        services: tenant.services.map(s => toApiService(s, tenant.service_resource_requirements, tenant.pricing_rules.length > 0)),
        serviceLocations: tenant.service_locations.map(sl => ({serviceId: sl.service_id, locationId: sl.location_id}))
    }
}

function slugQueryParam(requestValue: RequestValueExtractor = query('slug')): ParamExtractor<string> {
    return paramExtractor('slug', requestValue.extractor, (s) => s);
}

async function findTenantAndLocations(prisma: PrismaClient, slug: string, environment_id: string): Promise<DbTenantAndStuff | null> {
    return await prisma.tenants.findUnique({
        where: {
            slug
        },
        include: {
            tenant_images: {
                where: {
                    environment_id
                }
            },
            services: {
                where: {
                    environment_id
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
            }
        }
    });
}

export async function onGetTenantRequestExpress(req: express.Request, res: express.Response): Promise<void> {
    await expressBridge(productionDeps, onGetTenantRequestEndpoint, req, res)
}

export async function onGetTenantRequestEndpoint(deps: EndpointDependencies, req: RequestContext): Promise<EndpointOutcome[]> {
    return asHandler(deps, req).withTwoRequestParams(environmentIdParam(), slugQueryParam(), getTenant);
}

async function getTenant(deps: EndpointDependencies, environmentId: EnvironmentId, slug: string): Promise<EndpointOutcome[]> {
    const tenant = await findTenantAndLocations(deps.prisma, slug, environmentId.value);
    if (!tenant) {
        return [httpResponseOutcome(responseOf(404))];
    }
    return [httpResponseOutcome(responseOf(200, JSON.stringify(toApiTenant(tenant))))]

}
