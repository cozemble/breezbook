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
    images: ImageSummary[];
    markup: MarkupSummary[]
}

export interface ResourceSummary {
    _type: 'resource.summary'
    id: string
    name: string
    type: string
    locationIds: string[]
    branding?: ResourceBranding
}

function toResourceSummary(r: DbResource & { resource_images: DbResourceImage[] } & {
    resource_markup: DbResourceMarkup[]
} & { resource_availability: DbResourceAvailability[] }): ResourceSummary | ErrorResponse {
    if (r.resource_markup.some(m => m.markup_type !== 'markdown')) {
        return errorResponse(resources.errorCodes.unknownResourceType, `Unknown markup type: '${r.resource_markup.find(m => m.markup_type !== 'markdown')?.markup_type}'`)
    }
    const locationIds = Array.from(new Set(r.resource_availability.map(ra => ra.location_id).filter(locationId => locationId !== null))) as string[]
    return {
        _type: 'resource.summary',
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
            markup: r.resource_markup.map(m => {
                return ({
                    markup: m.markup,
                    markupType: 'markdown'
                });
            })
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
    const mapped = foundResources.map(toResourceSummary)
    const firstError = mapped.find(m => m._type === 'error.response')
    if (firstError) {
        return firstError as ErrorResponse
    }
    return mapped as ResourceSummary[]
}

export const resources = {
    errorCodes: {
        unknownResourceType: "unknown.resource.type",
        noProfileImage: "no.profile.image"
    },
    listByType
}

