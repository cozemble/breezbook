import {
    Booking,
    Resource,
    Service,
    ServiceId,
    serviceId as makeServiceId,
    BookableTimeSlots,
    tenantId as makeTenantId,
    TenantId
} from "./types.js";
import express from 'express';
import {supabaseClient} from "./supabase.js";

const AVAILABILITY: BookableTimeSlots = {
    "date": "2023-05-24",
    "slots": ["09:00", "10:00", "13:00", "14:00", "15:00"]
};

export function handleSlotAvailability(_: express.Request, res: express.Response) {
    res.send([AVAILABILITY]);
}

function validateDate(date: any): boolean {
    const newDate = new Date(date);
    return !isNaN(newDate.getTime());
}

function validateString(serviceId: any): boolean {
    return typeof serviceId === 'string' && serviceId.trim() !== '';
}

async function getBookingsFromSupabase(tenantId: TenantId, fromDate: string, toDate: string): Promise<Booking[]> {
    try {
        let response = await supabaseClient
            .from('bookings')
            .select('*')
            .gte('date', fromDate)
            .lte('date', toDate)
            .eq('tenant_id', tenantId.value);

        if (response.error) {
            console.error('Error while fetching bookings:', response.error);
            throw response.error;
        }

        return response.data;
    } catch (error) {
        console.error('Error while fetching bookings:', error);
        throw error;
    }
}

export async function handleSlotAvailability2(req: express.Request, res: express.Response) {
    try {
        // 1. Get the from date and to date from the query params
        const {fromDate, toDate, serviceId: serviceIdParam, tenantId: tenantIdParam} = req.query;

        // 2. Validate the input dates and serviceId
        if (!validateDate(fromDate) || !validateDate(toDate) || !validateString(serviceIdParam) || !validateString(tenantIdParam)) {
            return res.status(400).send('Invalid input parameters');
        }
        const tenantId = makeTenantId(tenantIdParam as string)
        const serviceId = makeServiceId(serviceIdParam as string)

        // 3. Get all existing bookings from Supabase within the given date range
        const bookings = await getBookingsFromSupabase(tenantId, fromDate as string, toDate as string);

        // 4. Get the service details from Supabase using the serviceId
        const service = await getServiceFromSupabase(tenantId, serviceId);

        // 5. Get all resources from Supabase (optional: filter by those relevant to the service)
        const resources = await getResourcesFromSupabase(tenantId);

        // 6. Calculate the available slots based on service duration, resources, and existing bookings
        const availableSlots = calculateAvailability(fromDate as string, toDate as string, service, bookings, resources);

        // 7. Format the availability data for the response
        const formattedAvailability = formatAvailabilityData(availableSlots);

        // 8. Send the availability data
        res.send(formattedAvailability);
    } catch (error) {
        // Handle any errors
        console.error('Error handling slot availability:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function getServiceFromSupabase(tenantId: TenantId, serviceId: ServiceId): Promise<Service> {

    try {
        let response = await supabaseClient
            .from('services')
            .select('*')
            .eq('id', serviceId.value)
            .eq('tenant_id', tenantId.value);

        if (response.error) {
            console.error('Error while fetching service:', response.error);
            throw response.error;
        }

        return response.data as Service;
    } catch (error) {
        console.error('Error while fetching service:', error);
        throw error;
    }
}

async function getResourcesFromSupabase(tenantId: TenantId) {
    try {
        let response = await supabaseClient
            .from('resources')
            .select('*')
            .eq('tenant_id', tenantId.value);

        if (response.error) {
            console.error('Error while fetching resources:', response.error);
            throw response.error;
        }

        return response.data;
    } catch (error) {
        console.error('Error while fetching resources:', error);
        throw error;
    }
}

function calculateAvailability(fromDate: string, toDate: string, service: Service, bookings: Booking, resources: Resource[]) {


}