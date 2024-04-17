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
import {DbTenant, DbTenantImage} from "../../prisma/dbtypes.js";
import {Tenant} from "@breezbook/backend-api-types";

function toApiTenant(tenant: DbTenant): Tenant {
    const tenantImages:DbTenantImage[] = (tenant as any).tenant_images ?? [];
    return {
        id: tenant.tenant_id,
        name: tenant.name,
        slug: tenant.slug,
        description: "Description to do",
        heading: "Heading to do",
        heroImage: tenantImages.length > 0 ? tenantImages[0].public_image_url : 'https://picsum.photos/800/450'
    }
}

function slugQueryParam(requestValue: RequestValueExtractor = query('slug')): ParamExtractor<string | null> {
    return paramExtractor('slug', requestValue.extractor, (s) => s);
}

export async function onGetTenantRequest(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, environmentIdParam(), slugQueryParam(), async (environmentId, slug) => {
        const prisma = prismaClient();
        const tenant = await prisma.tenants.findUnique({
            where: {
                slug
            },
            include: {
                tenant_images: true
            }
        });
        if(!tenant) {
            res.status(404).send({error: 'Not found'});
            return;
        }
        res.status(200).send(toApiTenant(tenant))
    });
}
