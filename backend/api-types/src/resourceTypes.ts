export interface ImageSummary {
    publicUrl: string;
    context: string;
    mimeType: string;
}

export interface MarkupSummary {
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

export interface ResourceRequirementOverride {
    requirementId: string
    resourceId: string
}

export function resourceRequirementOverride(requirementId: string, resourceId: string): ResourceRequirementOverride {
    return {requirementId, resourceId}
}