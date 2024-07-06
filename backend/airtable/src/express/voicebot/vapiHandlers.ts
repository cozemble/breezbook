import express from "express";
import {locationIdParam, tenantEnvironmentParam, withTwoRequestParams} from "../../infra/functionalExpress.js";
import {prismaClient} from "../../prisma/client.js";
import {byLocation} from "../../availability/byLocation.js";
import {isoDate, languages, mandatory, tenantEnvironmentLocation} from "@breezbook/packages-types";
import {businessDescription, webQueryPrompt} from "@breezbook/packages-voicebot-prompting";

export async function onVapiVoiceBotPromptRequest(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, tenantEnvironmentParam(), locationIdParam(), async (tenantEnvironment, locationid) => {
        const prisma = prismaClient();
        const tel = tenantEnvironmentLocation(tenantEnvironment.environmentId, tenantEnvironment.tenantId, locationid)
        const everything = await byLocation.getEverythingForAvailability(prisma, tel, isoDate(), isoDate())
        const tenantBranding = await prisma.tenant_branding.findUniqueOrThrow({
            where: {
                tenant_id_environment_id: {
                    tenant_id: tenantEnvironment.tenantId.value,
                    environment_id: tenantEnvironment.environmentId.value
                }
            },
            include: {
                tenants: true,
                tenant_branding_labels: {
                    where: {
                        language_id: languages.en.value
                    }
                }
            }
        });
        const firstLabels = mandatory(tenantBranding.tenant_branding_labels[0], "tenantBranding.tenant_branding_labels[0]")
        const description = businessDescription(tenantBranding.tenants.name, firstLabels.description, firstLabels.description)
        const prompt = webQueryPrompt(description, everything.businessConfiguration, everything.pricingRules, {serviceLabels:[], addOnLabels:[]})
        res.status(200).setHeader("Content-type", "text/plain").send(prompt)
    });
}
