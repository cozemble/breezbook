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
import {DbLocation, DbTenant, DbTenantImage} from "../../prisma/dbtypes.js";
import {Tenant} from "@breezbook/backend-api-types";
import {PrismaClient} from "@prisma/client";

type DbTenantAndStuff = DbTenant & { tenant_images: DbTenantImage[], locations: DbLocation[] };

function toApiTenant(tenant: DbTenantAndStuff): Tenant {
    const tenantImages: DbTenantImage[] = tenant.tenant_images ?? [];
    return {
        id: tenant.tenant_id,
        name: tenant.name,
        slug: tenant.slug,
        description: "Description to do",
        heading: "Heading to do",
        heroImage: tenantImages.length > 0 ? tenantImages[0].public_image_url : 'https://picsum.photos/800/450',
        locations: tenant.locations.map(l => ({id: l.id, slug: l.slug, name: l.name}))
    }
}

function slugQueryParam(requestValue: RequestValueExtractor = query('slug')): ParamExtractor<string | null> {
    return paramExtractor('slug', requestValue.extractor, (s) => s);
}


async function findTenantAndLocations(prisma: PrismaClient, slug: string): Promise<DbTenantAndStuff | null> {
    return await prisma.tenants.findUnique({
        where: {
            slug
        },
        include: {
            tenant_images: true,
            locations: true
        }
    });
}

export async function onGetTenantRequest(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, environmentIdParam(), slugQueryParam(), async (environmentId, slug) => {
        const tenant = await findTenantAndLocations(prismaClient(), slug);
        if (!tenant) {
            res.status(404).send({error: 'Not found'});
            return;
        }
        res.status(200).send(toApiTenant(tenant))
    });
}
