import axios from 'axios';
import type {
    AvailabilityResponse,
    CancellationGrantResponse,
    OrderCreatedResponse,
    PaymentIntentResponse,
    PricedCreateOrderRequest,
    Tenant,
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
            .get<Tenant>(`${config.apiUrl}/tenants?slug=${slug}`)
            .then((res) => res.data as Tenant)
            .catch((e) => {
                console.error(e)
                return null;
            });

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

        const res: Service[] = tenant.services.map(s => ({
            tenantId: tenant.id,
            id: s.id,
            slug: s.slug,
            name: s.name,
            description: s.description,
            image: s.image,
            approximatePrice: s.priceWithNoDecimalPlaces,
            approximateDuration: s.durationMinutes,
        }))

        const tenantServices = config.devMode
            ? mock.services.filter((service) => service.tenantId === tenant.id)
            : undefined;

        return res || tenantServices || null;
    }
};

const booking = {
    getAvailability: async (
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
            .then((res) => res.data),

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
