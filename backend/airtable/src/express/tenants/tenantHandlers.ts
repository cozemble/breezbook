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
import {DbLocation, DbTenant, DbTenantBranding, DbTenantImage} from "../../prisma/dbtypes.js";
import {Tenant} from "@breezbook/backend-api-types";
import {PrismaClient} from "@prisma/client";
import {mandatory} from "@breezbook/packages-core";

type DbTenantAndStuff = DbTenant & { tenant_images: DbTenantImage[], locations: DbLocation[], tenant_branding: DbTenantBranding[] };

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
        theme: branding.theme
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
            tenant_images: true,
            tenant_branding: {
                where: {
                    environment_id
                }
            },
            locations: true
        }
    });}

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
