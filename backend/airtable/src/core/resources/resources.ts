import {PrismaClient} from '@prisma/client'
import {ResourceType, TenantEnvironmentLocation} from "@breezbook/packages-core";
import {errorResponse, ErrorResponse} from "@breezbook/backend-api-types";
import {DbResource, DbResourceAvailability, DbResourceImage, DbResourceMarkup} from "../../prisma/dbtypes.js";

interface ImageSummary {
    publicUrl: string;
    context: string;
    mimeType: string;
}

interface MarkupSummary {
    markup: string;
    markupType: 'markdown'
}

export interface ResourceBranding {
    images: ImageSummary;
    markup: MarkupSummary[]
}

export interface ResourceSummary {
    id: string
    name: string
    type: string
    locationIds: string[]
    branding?: ResourceBranding
}

function toResourceSummary(r: DbResource & { resource_images: DbResourceImage[] } & {
    resource_markup: DbResourceMarkup[]
} & { resource_availability: DbResourceAvailability[] }): ResourceSummary | ErrorResponse {
    const locationIds = Array.from(new Set(r.resource_availability.map(ra => ra.location_id).filter(locationId => locationId !== null))) as string[]
    return {
        id: r.id,
        name: r.name,
        type: r.resource_type,
        locationIds,
        branding: {
            images: r.resource_images.map(i => ({
                publicUrl: i.public_image_url,
                context: i.context,
                mimeType: i.mime_type
            })),
            markup: r.resource_markup.map(m => ({
                markup: m.markup,
                markupType: m.markup_type
            }))
        }
    }

}

async function listByType(prisma: PrismaClient, tenantEnvironmentLoc: TenantEnvironmentLocation, type: ResourceType): Promise<ResourceSummary[] | ErrorResponse> {
    const foundType = await prisma.resource_types.findFirst({
        where: {
            tenant_id: tenantEnvironmentLoc.tenantId.value,
            environment_id: tenantEnvironmentLoc.environmentId.value,
            name: type.value
        }
    });
    if (!foundType) {
        return errorResponse(resources.errorCodes.unknownResourceType, `Unknown resource type: '${type.value}'`)
    }
    const foundResources = await prisma.resources.findMany({
        where: {
            resource_type: foundType.id,
            tenant_id: tenantEnvironmentLoc.tenantId.value,
            environment_id: tenantEnvironmentLoc.environmentId.value
        },
        include: {
            resource_images: true,
            resource_markup: true,
            resource_availability: true,
        }
    })
    return foundResources.map(toResourceSummary)
}

export const resources = {
    errorCodes: {
        unknownResourceType: "unknown.resource.type",
        noProfileImage: "no.profile.image"
    },
    listByType
}

