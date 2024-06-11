import express from "express";
import {prismaClient} from "../../prisma/client.js";
import {
    asHandler,
    date,
    EndpointDependencies,
    query,
    serviceIdParam,
    tenantEnvironmentLocationParam
} from "../../infra/endpoint.js";
import {responseOf} from "@http4t/core/responses.js";
import {byLocation} from "../../availability/byLocation.js";
import {multiLocationGym} from "../../dx/loadMultiLocationGymTenant.js";
import {getAvailabilityForService, getAvailabilityForService2} from "../../core/getAvailabilityForService.js";


function productionDeps(): EndpointDependencies {
    return {
        prisma: prismaClient(),
        httpClient: {
            handle: async () => responseOf(500, 'Not implemented')
        },
        eventSender: async (event) => {
            console.log('Event sent', event);
        }
    }
}

export async function getServiceAvailabilityForLocation2(req: express.Request, res: express.Response): Promise<void> {
    await asHandler(productionDeps, req, res).withFourRequestParams(tenantEnvironmentLocationParam(), serviceIdParam(), date(query('fromDate')), date(query('toDate')), async (deps, tenantEnvLoc, serviceId, fromDate, toDate) => {
        console.log(
            `Getting availability for location ${tenantEnvLoc.locationId.value}, tenant ${tenantEnvLoc.tenantId.value} and service ${serviceId.value} from ${fromDate.value} to ${toDate.value} in environment ${tenantEnvLoc.environmentId.value}`
        );
        const everythingForTenant = await byLocation.getEverythingForAvailability(deps.prisma, tenantEnvLoc, fromDate, toDate);
        if (tenantEnvLoc.tenantId.value === multiLocationGym.tenant_id) {
            return responseOf(200, JSON.stringify(getAvailabilityForService2(everythingForTenant, serviceId, fromDate, toDate)));
        } else {
            return responseOf(200, JSON.stringify(getAvailabilityForService(everythingForTenant, serviceId, fromDate, toDate)));
        }
    });
}
