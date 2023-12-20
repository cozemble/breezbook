import {
    BookableTimeSlots,
    BusinessAvailability,
    BusinessConfiguration,
    isoDate, ResourceDayAvailability, Service, StartTimeSpec,
    TenantId,
    tenantId,
    time24, TimeslotSpec,
    timeslotSpec
} from "./types.js";
import express from 'express';
import {PricingRule} from "./calculatePrice.js";

const AVAILABILITY: BookableTimeSlots = {
    "date": isoDate("2023-05-24"),
    "bookableSlots": [
        timeslotSpec(time24("09:00"), time24("13:00"), "09:00 - 13:00"),
        timeslotSpec(time24("13:00"), time24("17:00"), "13:00 - 17:00")]
};

export interface EverythingForTenant {
    businessConfiguration: BusinessConfiguration
    pricingRules: PricingRule[]
}

async function getEverythingForTenant(tenantId: TenantId) {
    // availability: BusinessAvailability;
    // resourceAvailability: ResourceDayAvailability[];
    // services: Service[];
    // timeslots: TimeslotSpec[];
    // startTimeSpec: StartTimeSpec

    /**
     * For date range:
     * Load normal business hours
     * Load blocked off times
     * Load resources
     * Load resource availability
     * Load resource outage times
     * Load services
     * Load time slots
     * Load pricing rules
     */

}

export async function getServiceAvailability(req: express.Request, res: express.Response) {
    const tenantIdValue = req.params.tenantId;
    const serviceIdValue = req.params.serviceId;
    const fromDateValue = req.query.fromDate;
    const toDateValue = req.query.toDate;
    console.log(`Getting availability for tenant ${tenantIdValue} and service ${serviceIdValue} from ${fromDateValue} to ${toDateValue}`);
    if(!tenantIdValue || !serviceIdValue || !fromDateValue || !toDateValue) {
        res.status(400).send('Missing required parameters');
        return;
    }
    const everythingForTenant = await getEverythingForTenant(tenantId(tenantIdValue));
    res.send([AVAILABILITY]);
}