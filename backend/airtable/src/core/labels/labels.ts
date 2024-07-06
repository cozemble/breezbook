import {
    AddOnId,
    addOnId,
    LanguageId,
    mandatory,
    ServiceId,
    serviceId,
    TenantEnvironment,
    TenantEnvironmentLocation
} from "@breezbook/packages-types";
import {PrismaClient} from "@prisma/client";
import {addOnLabels, AddOnLabels, serviceLabels, ServiceLabels} from "@breezbook/packages-core";

export interface Labels {
    serviceLabels: ServiceLabels[];
    addOnLabels: AddOnLabels[]
}

export const labelsFns = {
    findAddOnLabels: (labels: Labels, addOnId: AddOnId) => mandatory(labels.addOnLabels.find(l => l.addOnId.value === addOnId.value), `No label found for add-on ${addOnId.value}`),
    findServiceLabels: (labels: Labels, serviceId: ServiceId) => mandatory(labels.serviceLabels.find(l => l.serviceId.value === serviceId.value), `No label found for service ${serviceId.value}`)
}

export async function getLabelsForTenant(prisma: PrismaClient, tenantEnv: TenantEnvironment | TenantEnvironmentLocation, languageId: LanguageId): Promise<Labels> {
    const tenant_id = tenantEnv.tenantId.value;
    const environment_id = tenantEnv.environmentId.value;
    const language_id = languageId.value;

    const dbServiceLabels = await prisma.service_labels.findMany({
        where: {
            tenant_id,
            environment_id,
            language_id
        }
    });
    const dbAddOnLabels = await prisma.add_on_labels.findMany({
        where: {
            tenant_id,
            environment_id,
            language_id
        }
    });

    return {
        serviceLabels: dbServiceLabels.map(l => serviceLabels(l.name, l.description, serviceId(l.service_id), languageId)),
        addOnLabels: dbAddOnLabels.map(l => addOnLabels(l.name, l.description, addOnId(l.add_on_id), languageId))
    }
}