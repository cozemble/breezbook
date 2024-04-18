import express from 'express';
import {
    date,
    query,
    serviceIdParam,
    tenantEnvironmentParam,
    withFourRequestParams
} from '../infra/functionalExpress.js';
import {getEverythingForAvailability} from './getEverythingForAvailability.js';
import {getAvailabilityForService} from '../core/getAvailabilityForService.js';
import {prismaClient} from "../prisma/client.js";

export async function getServiceAvailability(req: express.Request, res: express.Response): Promise<void> {
    await withFourRequestParams(
        req,
        res,
        tenantEnvironmentParam(),
        serviceIdParam(),
        date(query('fromDate')),
        date(query('toDate')),
        async (tenantEnvironment, serviceId, fromDate, toDate) => {
            console.log(
                `Getting availability for tenant ${tenantEnvironment.tenantId.value} and service ${serviceId.value} from ${fromDate.value} to ${toDate.value} in environment ${tenantEnvironment.environmentId.value}`
            );
            const everythingForTenant = await getEverythingForAvailability(prismaClient(), tenantEnvironment, fromDate, toDate);
            res.send(getAvailabilityForService(everythingForTenant, serviceId, fromDate, toDate));
        }
    );
}
