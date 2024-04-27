import express from "express";
import {
    environmentIdParam,
    paramExtractor,
    ParamExtractor,
    query,
    RequestValueExtractor,
    withTwoRequestParams
} from "../../infra/functionalExpress.js";
import {prismaClient} from "../../prisma/client.js";
import {
    DbLocation,
    DbPricingRule,
    DbService,
    DbServiceLocation,
    DbTenant,
    DbTenantBranding,
    DbTenantImage
} from "../../prisma/dbtypes.js";
import {Tenant} from "@breezbook/backend-api-types";
import {PrismaClient} from "@prisma/client";
import {mandatory} from "@breezbook/packages-core";
import {toApiService} from "../services/serviceHandlers.js";

type DbTenantAndStuff = DbTenant & {
    tenant_images: DbTenantImage[],
    locations: DbLocation[],
    tenant_branding: DbTenantBranding[],
    services: DbService[],
    service_locations: DbServiceLocation[],
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
        services: tenant.services.map(s => toApiService(s, tenant.pricing_rules.length > 0)),
        serviceLocations: tenant.service_locations.map(sl => ({serviceId: sl.service_id, locationId: sl.location_id}))
    }
}

function slugQueryParam(requestValue: RequestValueExtractor = query('slug')): ParamExtractor<string | null> {
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

export async function onGetTenantRequest(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, environmentIdParam(), slugQueryParam(), async (environmentId, slug) => {
        const tenant = await findTenantAndLocations(prismaClient(), slug, environmentId.value);
        if (!tenant) {
            res.status(404).send({error: 'Not found'});
            return;
        }
        res.status(200).send(toApiTenant(tenant))
    });
}
