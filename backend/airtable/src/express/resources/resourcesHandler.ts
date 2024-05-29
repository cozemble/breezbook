import express from "express";
import {
    paramExtractor,
    ParamExtractor,
    path,
    RequestValueExtractor,
    sendJson,
    tenantEnvironmentLocationParam,
    withTwoRequestParams
} from "../../infra/functionalExpress.js";
import {prismaClient} from "../../prisma/client.js";
import {resourceType, ResourceType} from "@breezbook/packages-core";
import {resources} from "../../core/resources/resources.js";

export function resourceTypeParam(requestValue: RequestValueExtractor = path('type')): ParamExtractor<ResourceType | null> {
    return paramExtractor('type', requestValue.extractor, resourceType);
}

export async function onListResourcesByTypeRequest(req: express.Request, res: express.Response): Promise<void> {
    await withTwoRequestParams(req, res, tenantEnvironmentLocationParam(), resourceTypeParam(), async (tenantEnvironmentLocation, resourceType) => {
        const prisma = prismaClient();
        const outcome = await resources.listByType(prisma, tenantEnvironmentLocation, resourceType);
        if (Array.isArray(outcome)) {
            sendJson(res, outcome)
        } else {
            res.status(400).send(outcome);
        }
    });
}
