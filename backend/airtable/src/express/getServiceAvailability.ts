import {AddOn as DomainAddOn, Form, Service as DomainService, ServiceId, values,} from "../types.js";
import express from 'express';
import {calculatePrice} from "../calculatePrice.js";
import {withAdminPgClient} from "../infra/postgresPool.js";
import {mandatory} from "../utils.js";
import {calculateAvailability} from "../calculateAvailability.js";
import {AddOnSummary, emptyAvailabilityResponse, ServiceSummary, timeSlotAvailability} from "../apiTypes.js";
import {date, query, serviceIdParam, tenantIdParam, withFourRequestParams} from "../infra/functionalExpress.js";
import {getEverythingForTenant} from "./getEverythingForTenant.js";


function getServiceSummary(services: DomainService[], serviceId: ServiceId, forms: Form[]): ServiceSummary {
    const service = mandatory(services.find(s => s.id.value === serviceId.value), `Service with id ${serviceId.value} not found`);
    const result: ServiceSummary = {
        name: service.name,
        id: serviceId.value,
        durationMinutes: service.duration,
        description: service.description
    };
    const serviceFormId = service.serviceFormId;
    if (serviceFormId) {
        result.form = mandatory(forms.find(f => values.isEqual(f.id, serviceFormId)), `Form with id ${serviceFormId.value} not found`);
    }
    const customerFormId = service.customerFormId;
    if (customerFormId) {
        result.customerForm = mandatory(forms.find(f => values.isEqual(f.id, customerFormId)), `Form with id ${customerFormId.value} not found`);
    }
    return result;
}

function getAddOnSummaries(services: DomainService[], addOns: DomainAddOn[], serviceId: ServiceId): AddOnSummary[] {
    const service = mandatory(services.find(s => s.id.value === serviceId.value), `Service with id ${serviceId.value} not found`);
    const permittedAddOns = service.permittedAddOns.map(ao => mandatory(addOns.find(a => a.id.value === ao.value), `Add on with id ${ao.value} not found`));
    return permittedAddOns.map(ao => ({
        name: ao.name,
        id: ao.id.value,
        priceWithNoDecimalPlaces: ao.price.amount.value,
        priceCurrency: ao.price.currency.value,
        requiresQuantity: ao.requiresQuantity
    }))
}


export async function getServiceAvailability(req: express.Request, res: express.Response): Promise<void> {
    await withFourRequestParams(req, res, tenantIdParam(), serviceIdParam(), date(query('fromDate')), date(query('toDate')), async (tenantId, serviceId, fromDate, toDate) => {
        console.log(`Getting availability for tenant ${tenantId.value} and service ${serviceId.value} from ${fromDate.value} to ${toDate.value}`);

        const everythingForTenant = await withAdminPgClient(async (client) => await getEverythingForTenant(client, tenantId, fromDate, toDate));
        const availability = calculateAvailability(everythingForTenant.businessConfiguration, everythingForTenant.bookings, serviceId, fromDate, toDate);
        const priced = availability.map(a => {
            if (a._type === 'bookable.times') {
                return a;
            }
            return calculatePrice(a, everythingForTenant.pricingRules);
        })
        const response = priced.reduce((acc, curr) => {
            if (curr._type === 'bookable.times') {
                throw new Error('Not yet implemented')
            }
            const slotsForDate = acc.slots[curr.slot.date.value] ?? []
            const currTimeslot = timeSlotAvailability(curr.slot.slot.slot.from.value, curr.slot.slot.slot.to.value, curr.slot.slot.description, curr.price.amount.value, curr.price.currency.value)
            if (!slotsForDate.some(a => a.label === currTimeslot.label)) {
                slotsForDate.push(currTimeslot)
            }
            acc.slots[curr.slot.date.value] = slotsForDate;
            return acc;
        }, emptyAvailabilityResponse(
            getServiceSummary(everythingForTenant.businessConfiguration.services, serviceId, everythingForTenant.businessConfiguration.forms),
            getAddOnSummaries(everythingForTenant.businessConfiguration.services, everythingForTenant.businessConfiguration.addOns, serviceId)))

        res.send(response);
    })
}