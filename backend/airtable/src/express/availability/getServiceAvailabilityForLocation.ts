import express from "express";
import {
    date,
    locationIdParam,
    query,
    serviceIdParam,
    tenantEnvironmentParam,
    withFiveRequestParams
} from "../../infra/functionalExpress.js";
import {prismaClient} from "../../prisma/client.js";
import {getAvailabilityForService} from "../../core/getAvailabilityForService.js";
import {byLocation} from "../../availability/byLocation.js";
import {tenantEnvironmentLocation} from "@breezbook/packages-core";

export async function getServiceAvailabilityForLocation(req: express.Request, res: express.Response): Promise<void> {
    await withFiveRequestParams(
        req,
        res,
        tenantEnvironmentParam(),
        serviceIdParam(),
        locationIdParam(),
        date(query('fromDate')),
        date(query('toDate')),
        async (tenantEnvironment, serviceId, locationId, fromDate, toDate) => {
            console.log(
                `Getting availability for location ${locationId.value}, tenant ${tenantEnvironment.tenantId.value} and service ${serviceId.value} from ${fromDate.value} to ${toDate.value} in environment ${tenantEnvironment.environmentId.value}`
            );
            const tenantEnvLoc = tenantEnvironmentLocation(tenantEnvironment.environmentId, tenantEnvironment.tenantId, locationId)
            const everythingForTenant = await byLocation.getEverythingForAvailability(prismaClient(), tenantEnvLoc, fromDate, toDate);
            res.send(getAvailabilityForService(everythingForTenant, serviceId, fromDate, toDate));
        }
    );
}
