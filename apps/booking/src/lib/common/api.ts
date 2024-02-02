import mock, { services } from '$lib/mock';
import type { AvailabilityResponse, CreateOrderRequest } from '@breezbook/backend-api-types';

// TODO: replace with real fetch

export const tenant = {
	getOne: async (slug: string) => {
		const tenant = mock.tenants.find((tenant) => tenant.slug === slug);

		return tenant || null;
	},

	getAll: async () => {
		return mock.tenants;
	}
};

export const service = {
	getOne: async (tenantSlug: string, serviceSlug: string) => {
		const tenant = await api.tenant.getOne(tenantSlug);
		if (!tenant) return null;

		const service = services.find((service) => service.slug === serviceSlug);
		return service || null;
	},

	getAll: async (tenantSlug: string) => {
		const tenant = await api.tenant.getOne(tenantSlug);
		if (!tenant) return null;

		const tenantServices = services.filter((service) => service.tenantId === tenant.id);
		return tenantServices || null;
	},

	getDetails: async (tenantSlug: string, serviceSlug: string) => {
		// TODO this is just for testing, remove it later
		tenantSlug = 'tenant1';
		serviceSlug = 'smallCarWash';

		// TODO set the api url as an env variable
		// TODO handle errors properly

		const response = await fetch(
			`https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/api/dev/${tenantSlug}/service/${serviceSlug}/availability?fromDate=2024-01-17&toDate=2024-01-24`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.ok) throw new Error('Network response was not ok');

		const contentType = response.headers.get('content-type');
		const isJson = contentType && contentType.includes('application/json');
		if (!isJson) throw new Error('Response was not valid JSON');

		const data = (await response.json()) as AvailabilityResponse;

		return data;
	}
};

export const timeSlot = {
	getAll: async (
		tenantSlug: string,
		serviceSlug: string,
		filters: {
			fromDate: Date;
			toDate: Date;
		}
	) => {
		// TODO this is just for testing, remove it later
		tenantSlug = 'tenant1';
		serviceSlug = 'smallCarWash';

		// TODO filter with fromDate and toDate
		// TODO set the api url as an env variable
		// TODO handle errors properly

		// format: YYYY-MM-DD
		const filtersAsUrlParams = new URLSearchParams({
			fromDate: filters.fromDate.toISOString().split('T')[0],
			toDate: filters.toDate.toISOString().split('T')[0]
		}).toString();

		const response = await fetch(
			`https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/api/dev/${tenantSlug}/service/${serviceSlug}/availability?${filtersAsUrlParams}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);

		if (!response.ok) {
			console.error('Network response was not ok');
			return [];
		}

		const contentType = response.headers.get('content-type');
		const isJson = contentType && contentType.includes('application/json');
		if (!isJson) {
			console.error('Response was not valid JSON');
			return [];
		}

		const data = (await response.json()) as AvailabilityResponse;

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
	}
};

export const booking = {
	placeOrder: async (order: CreateOrderRequest) => {
		const tenantSlug = 'tenant1';

		const response = await fetch(
			`https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/api/dev/${tenantSlug}/orders`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(order)
			}
		);

		if (!response.ok) {
			console.error('Network response was not ok');
			return;
		}

		const contentType = response.headers.get('content-type');
		const isJson = contentType && contentType.includes('application/json');
		if (!isJson) {
			console.error('Response was not valid JSON');
			return;
		}

		const data = await response.json();

		return data;
	}
};

const api = {
	tenant,
	service,
	timeSlot,
	booking
};

export default api;
