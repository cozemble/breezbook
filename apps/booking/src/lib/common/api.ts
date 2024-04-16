import axios from 'axios';
import type {
	AvailabilityResponse,
	CreateOrderRequest,
	OrderCreatedResponse,
	PaymentIntentResponse,
	UnpricedBasket,
	CancellationGrantResponse
} from '@breezbook/backend-api-types';
import { type PricedBasket } from '@breezbook/backend-api-types';

import mock from '$lib/common/mock';

import { env } from '$env/dynamic/public';

const PUBLIC_API_URL = env.PUBLIC_API_URL;
const dev = env?.PUBLIC_DEV_MODE || false;

// TODO: remove mock
// TODO: enable real tenant and service slugs

const tenant = {
	getOne: async (slug: string) => {
		const tenant = mock.tenants.find((tenant) => tenant.slug === slug);

		return tenant || null;
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
		const service = await booking
			.getDetails(tenantSlug, serviceSlug)
			.then((res): Service => {
				return {
					id: res.serviceSummary.id,
					name: res.serviceSummary.name,
					description: res.serviceSummary.description,
					tenantId: tenant.id,
					approximateDuration: res.serviceSummary.durationMinutes,
					image: 'https://picsum.photos/400/203',
					approximatePrice: Object.values(res.slots)[0][0].priceWithNoDecimalPlaces,
					slug: serviceSlug
				};
			})
			.catch(() => null);
		const mockService = mock.services.find((service) => service.slug === serviceSlug);
		return service || mockService || null;
	},

	getAll: async (tenantSlug: string) => {
		const tenant = await api.tenant.getOne(tenantSlug);
		if (!tenant) return null;

		const tenantServices = mock.services.filter((service) => service.tenantId === tenant.id);
		return tenantServices || null;
	}
};

const booking = {
	getDetails: async (tenantSlug: string, serviceSlug: string) =>
		axios
			.post<AvailabilityResponse>(
				`${PUBLIC_API_URL}/${dev ? 'tenant1' : tenantSlug}/service/${
					dev ? 'smallCarWash.id' : serviceSlug
				}/availability?fromDate=2024-02-01&toDate=2024-02-07`,
				{
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
			.then((res) => res.data),

	getTimeSlots: async (
		tenantSlug: string,
		serviceSlug: string,
		filters: {
			fromDate: Date;
			toDate: Date;
		}
	) =>
		axios
			.post<AvailabilityResponse>(
				`${PUBLIC_API_URL}/${dev ? 'tenant1' : tenantSlug}/service/${
					dev ? 'smallCarWash.id' : serviceSlug
				}/availability`,
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
			.post<OrderCreatedResponse>(`${PUBLIC_API_URL}/${dev ? 'tenant1' : tenantSlug}/orders`, order)
			.then((res) => res.data),

	requestCancellationGrant: async (tenantSlug: string, bookingId: string) =>
		axios
			.post<CancellationGrantResponse>(
				`${PUBLIC_API_URL}/${dev ? 'tenant1' : tenantSlug}/booking/${bookingId}/cancellation/grant`
			)
			.then((res) => res.data),

	commitCancellation: (tenantSlug: string, bookingId: string, cancellationId: string) =>
		axios
			.post(
				`${PUBLIC_API_URL}/${
					dev ? 'tenant1' : tenantSlug
				}/booking/${bookingId}/cancellation/${cancellationId}/commit`
			)
			.then((res) => res.data)
};

const payment = {
	createPaymentIntent: async (tenantSlug: string, orderId: string) =>
		axios
			.post<PaymentIntentResponse>(
				`${PUBLIC_API_URL}/${dev ? 'tenant1' : tenantSlug}/orders/${orderId}/paymentIntent`
			)
			.then((res) => res.data)
};

const basket = {
	pricing: async (tenantSlug: string, basket: UnpricedBasket) =>
		axios
			.post<PricedBasket>(`${PUBLIC_API_URL}/${dev ? 'tenant1' : tenantSlug}/basket/price`, basket)
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
