import { get } from 'svelte/store';
import axios from 'axios';
import type {
	AvailabilityResponse,
	CreateOrderRequest,
	OrderCreatedResponse,
	PaymentIntentResponse,
	UnpricedBasket,
	CancellationGrantResponse,
	Tenant as ApiTenant,
	Service as ApiService
} from '@breezbook/backend-api-types';
import { type PricedBasket } from '@breezbook/backend-api-types';

import { env } from '$env/dynamic/public';
import mock from '$lib/common/mock';

const PUBLIC_API_URL = env.PUBLIC_API_URL;
const dev = env?.PUBLIC_DEV_MODE || false;

// TODO: remove mock
// TODO: enable real tenant and service slugs

const tenant = {
	getOne: async (slug: string) => {
		const res = await axios
			.get<ApiTenant>(`${PUBLIC_API_URL}/tenants?slug=${slug}`)
			.then((res) => res.data as Tenant)
			.catch(() => null);

		const mockTenant = dev ? mock.tenants.find((tenant) => tenant.slug === slug) : undefined;

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

		const mockService = dev
			? mock.services.find((service) => service.slug === serviceSlug)
			: undefined;

		return res || mockService || null;
	},

	getAll: async (tenantSlug: string) => {
		// TODO use tenant id instead of slug
		const tenant = await api.tenant.getOne(tenantSlug);
		if (!tenant) return null;

		const res = await axios
			.get<ApiService[]>(`${PUBLIC_API_URL}/${tenantSlug}/services`)
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

		const tenantServices = dev
			? mock.services.filter((service) => service.tenantId === tenant.id)
			: undefined;

		return res || tenantServices || null;
	}
};

const booking = {
	getDetails: async (tenantSlug: string, locationId: string, serviceSlug: string) =>
		axios
			.post<AvailabilityResponse>(
				`${PUBLIC_API_URL}/${tenantSlug}/${locationId}/service/${serviceSlug}/availability?fromDate=2024-02-01&toDate=2024-02-07`,
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
		serviceSlug: string,
		filters: {
			fromDate: Date;
			toDate: Date;
		}
	) =>
		axios
			.post<AvailabilityResponse>(
				`${PUBLIC_API_URL}/${tenantSlug}/${locationId}/service/${serviceSlug}/availability`,
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
					const day: DaySlot = { date: key, timeSlots };

					return [...prev, day];
				}, [] as DaySlot[]);

				return adaptedDays;
			}),

	placeOrder: async (tenantSlug: string, order: CreateOrderRequest) =>
		axios
			.post<OrderCreatedResponse>(`${PUBLIC_API_URL}/${tenantSlug}/orders`, order)
			.then((res) => res.data),

	requestCancellationGrant: async (tenantSlug: string, bookingId: string) =>
		axios
			.post<CancellationGrantResponse>(
				`${PUBLIC_API_URL}/${tenantSlug}/booking/${bookingId}/cancellation/grant`
			)
			.then((res) => res.data),

	commitCancellation: (tenantSlug: string, bookingId: string, cancellationId: string) =>
		axios
			.post(
				`${PUBLIC_API_URL}/${tenantSlug}/booking/${bookingId}/cancellation/${cancellationId}/commit`
			)
			.then((res) => res.data)
};

const payment = {
	createPaymentIntent: async (tenantSlug: string, orderId: string) =>
		axios
			.post<PaymentIntentResponse>(
				`${PUBLIC_API_URL}/${tenantSlug}/orders/${orderId}/paymentIntent`
			)
			.then((res) => res.data)
};

const basket = {
	pricing: async (tenantSlug: string, basket: UnpricedBasket) =>
		axios
			.post<PricedBasket>(`${PUBLIC_API_URL}/${tenantSlug}/basket/price`, basket)
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
