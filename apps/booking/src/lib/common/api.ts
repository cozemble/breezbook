import axios from 'axios';
import type {
	AvailabilityResponse,
	CreateOrderRequest,
	OrderCreatedResponse,
	PaymentIntentResponse,
	UnpricedBasket
} from '@breezbook/backend-api-types';
import { type PricedBasket } from '@breezbook/backend-api-types';

import mock from '$lib/common/mock';

import { PUBLIC_API_URL } from '$env/static/public';

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

		const service = mock.services.find((service) => service.slug === serviceSlug);
		return service || null;
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
				`${PUBLIC_API_URL}/${'tenant1'}/service/${'smallCarWash'}/availability?fromDate=2024-02-01&toDate=2024-02-07`,
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
				`${PUBLIC_API_URL}/${'tenant1'}/service/${'smallCarWash'}/availability`,
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
			.post<OrderCreatedResponse>(`${PUBLIC_API_URL}/${'tenant1'}/orders`, order)
			.then((res) => res.data)
};

const payment = {
	createPaymentIntent: async (tenantSlug: string, orderId: string) =>
		axios
			.post<PaymentIntentResponse>(`${PUBLIC_API_URL}/${'tenant1'}/orders/${orderId}/paymentIntent`)
			.then((res) => res.data)
};

const basket = {
	pricing: async (tenantSlug: string, basket: UnpricedBasket) =>
		axios
			.post<PricedBasket>(`${PUBLIC_API_URL}/${'tenant1'}/basket/price`, basket)
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
