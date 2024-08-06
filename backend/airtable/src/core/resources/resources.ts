import {PrismaClient} from '@prisma/client'
import {LanguageId, mandatory, ResourceType, TenantEnvironmentLocation} from "@breezbook/packages-types";
import {errorResponse, ErrorResponse, ResourceSummary} from "@breezbook/backend-api-types";
import {
    DbResource,
    DbResourceAvailability,
    DbResourceImage,
    DbResourceMarkup,
    DbResourceMarkupLabel
} from "../../prisma/dbtypes.js";


type DbResourceMarkupAndLabel = DbResourceMarkup & { resource_markup_labels: DbResourceMarkupLabel[] }

function toResourceSummary(r: DbResource & { resource_images: DbResourceImage[] } & {
    resource_markup: DbResourceMarkupAndLabel[]
} & { resource_availability: DbResourceAvailability[] }): ResourceSummary | ErrorResponse {
    if (r.resource_markup.some(m => m.markup_type !== 'markdown')) {
        return errorResponse(resources.errorCodes.unknownResourceType, `Unknown markup type: '${r.resource_markup.find(m => m.markup_type !== 'markdown')?.markup_type}'`)
    }
    const locationIds = Array.from(new Set(r.resource_availability.map(ra => ra.location_id).filter(locationId => locationId !== null))) as string[]
    return {
        _type: 'resource.summary',
        id: r.id,
        name: r.name,
        type: r.resource_type_id,
        locationIds,
        branding: {
            images: r.resource_images.map(i => ({
                publicUrl: i.public_image_url,
                context: i.context,
                mimeType: i.mime_type
            })),
            markup: r.resource_markup.map(m => {
                const theLabel = mandatory(m.resource_markup_labels[0], 'resource_markup_labels[0]')
                return ({
                    markup: theLabel.markup,
                    markupType: 'markdown'
                });
            })
        }
    }

}

async function listByType(prisma: PrismaClient, tenantEnvironmentLoc: TenantEnvironmentLocation, type: ResourceType, languageId:LanguageId): Promise<ResourceSummary[] | ErrorResponse> {
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
            resource_type_id: foundType.id,
            tenant_id: tenantEnvironmentLoc.tenantId.value,
            environment_id: tenantEnvironmentLoc.environmentId.value
        },
        include: {
            resource_images: true,
            resource_markup: {
                include: {
                    resource_markup_labels: {
                        where: {
                            language_id: languageId.value
                        }
                    }
                }
            },
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

