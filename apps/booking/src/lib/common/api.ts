import axios from 'axios';
import type {
    AvailabilityResponse,
    CancellationGrantResponse,
    OrderCreatedResponse,
    PaymentIntentResponse,
    PricedCreateOrderRequest,
    Service as ApiService,
    Tenant as ApiTenant,
    UnpricedBasket
} from '@breezbook/backend-api-types';
import {type PricedBasket} from '@breezbook/backend-api-types';

import mock from '$lib/common/mock';
import config from './config';

// TODO: remove mock
// TODO: enable real tenant and service slugs

const tenant = {
    getOne: async (slug: string) => {
        const res = await axios
            .get<ApiTenant>(`${config.apiUrl}/tenants?slug=${slug}`)
            .then((res) => res.data as Tenant)
            .catch(() => null);

        const mockTenant = config.devMode
            ? mock.tenants.find((tenant) => tenant.slug === slug)
            : undefined;

        return res || mockTenant || null;
    },

    getAll: async () => {
        return mock.tenants;
    }
};

const service = {
    getOne: async (tenantSlug: string, serviceSlug: string) => {
        const tenant = await api.tenant.getOne(tenantSlug);
        if (!tenant) return null;

        // TODO remove mock
        const res = await service
            .getAll(tenantSlug)
            .then((res): Service | null => {
                if (!res) return null;

                const ser = res.find((service) => service.slug === serviceSlug);
                return ser || null;
            })
            .catch(() => null);

        const mockService = config.devMode
            ? mock.services.find((service) => service.slug === serviceSlug)
            : undefined;

        return res || mockService || null;
    },

    getAll: async (tenantSlug: string) => {
        // TODO use tenant id instead of slug
        const tenant = await api.tenant.getOne(tenantSlug);
        if (!tenant) return null;

        const res = await axios
            .get<ApiService[]>(`${config.apiUrl}/${tenantSlug}/services`)
            .then((res) =>
                res.data.map(
                    (service): Service => ({
                        ...service,
                        tenantId: tenant.id,
                        id: service.id,
                        slug: service.slug,
                        name: service.name,
                        description: service.description,
                        image: service.image,
                        approximateDuration: service.durationMinutes,
                        approximatePrice: service.priceWithNoDecimalPlaces
                    })
                )
            )
            .catch(() => null);

        const tenantServices = config.devMode
            ? mock.services.filter((service) => service.tenantId === tenant.id)
            : undefined;

        return res || tenantServices || null;
    }
};

const booking = {
    getDetails: async (tenantSlug: string, locationId: string, serviceId: string) =>
        axios
            .post<AvailabilityResponse>(
                `${config.apiUrl}/${tenantSlug}/${locationId}/service/${serviceId}/availability?fromDate=${
                    new Date().toISOString().split('T')[0]
                }&toDate=${
                    new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            )
            .then((res) => res.data),

    getTimeSlots: async (
        tenantSlug: string,
        locationId: string,
        serviceId: string,
        filters: {
            fromDate: Date;
            toDate: Date;
        }
    ) =>
        axios
            .post<AvailabilityResponse>(
                `${config.apiUrl}/${tenantSlug}/${locationId}/service/${serviceId}/availability`,
                undefined,
                {
                    params: {
                        fromDate: filters.fromDate.toISOString().split('T')[0],
                        toDate: filters.toDate.toISOString().split('T')[0]
                    }
                }
            )
            .then((res) => {
                const data = res.data;

                const adaptedDays: DaySlot[] = Object.entries(data.slots).reduce((prev, [key, value]) => {
                    const timeSlots: TimeSlot[] = value.map((slot) => ({
                        id: slot.timeslotId,
                        start: slot.startTime24hr,
                        end: slot.endTime24hr,
                        price: slot.priceWithNoDecimalPlaces,
                        day: key
                    }));
                    const day: DaySlot = {date: key, timeSlots};

                    return [...prev, day];
                }, [] as DaySlot[]);

                return adaptedDays;
            }),

    placeOrder: async (tenantSlug: string, order: PricedCreateOrderRequest) =>
        axios
            .post<OrderCreatedResponse>(`${config.apiUrl}/${tenantSlug}/orders`, order)
            .then((res) => res.data),

    requestCancellationGrant: async (tenantSlug: string, bookingId: string) =>
        axios
            .post<CancellationGrantResponse>(
                `${config.apiUrl}/${tenantSlug}/booking/${bookingId}/cancellation/grant`
            )
            .then((res) => res.data),

    commitCancellation: (tenantSlug: string, bookingId: string, cancellationId: string) =>
        axios
            .post(
                `${config.apiUrl}/${tenantSlug}/booking/${bookingId}/cancellation/${cancellationId}/commit`
            )
            .then((res) => res.data)
};

const payment = {
    createPaymentIntent: async (tenantSlug: string, orderId: string) =>
        axios
            .post<PaymentIntentResponse>(`${config.apiUrl}/${tenantSlug}/orders/${orderId}/paymentIntent`)
            .then((res) => res.data)
};

const basket = {
    pricing: async (tenantSlug: string, basket: UnpricedBasket) =>
        axios
            .post<PricedBasket>(`${config.apiUrl}/${tenantSlug}/basket/price`, basket)
            .then((res) => res.data)
};

const api = {
    tenant,
    service,
    booking,
    payment,
    basket
};

export default api;
