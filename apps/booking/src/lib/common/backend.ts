import mock, { services } from '$lib/mock';

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
		const tenant = await backend.tenant.getOne(tenantSlug);
		if (!tenant) return null;

		const service = services.find((service) => service.slug === serviceSlug);
		return service || null;
	},

	getAll: async (tenantSlug: string) => {
		const tenant = await backend.tenant.getOne(tenantSlug);
		if (!tenant) return null;

		const tenantServices = services.filter((service) => service.tenantId === tenant.id);
		return tenantServices || null;
	}
};

export const timeSlot = {
	getAll: async (tenantSlug: string, serviceSlug: string) => {
		// TODO use tenantSlug
		// TODO use serviceSlug
		// TODO filter with fromDate and toDate
		// TODO set the api url as an env variable
		// TODO handle errors properly

		const response = await fetch(
			`https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/api/tenant1/service/smallCarWash/availability?fromDate=2023-12-20&toDate=2023-12-29`,
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

		const data = await response.json();

		const daysObject = data.slots as {
			[key: string]: {
				_type: string;
				startTime24hr: string;
				endTime24hr: string;
				label: string;
				priceWithNoDecimalPlaces: string;
				priceCurrency: string;
			}[];
		};

		const adaptedDays: DaySlot[] = Object.entries(daysObject).reduce((prev, [key, value]) => {
			const date = new Date(key);
			const timeSlots: TimeSlot[] = value.map((slot) => ({
				from: slot.startTime24hr,
				to: slot.endTime24hr,
				price: Number(slot.priceWithNoDecimalPlaces),
				day: date
			}));
			const day: DaySlot = { date, timeSlots };

			return [...prev, day];
		}, [] as DaySlot[]);

		return adaptedDays;
	}
};

const backend = {
	tenant,
	service,
	timeSlot
};

export default backend;
