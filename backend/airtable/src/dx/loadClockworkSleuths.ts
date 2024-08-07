import { PrismaClient } from '@prisma/client';
import {
	upsertBusinessHours,
	upsertLocation,
	upsertResource,
	upsertResourceAvailability,
	upsertResourceType,
	upsertService,
	upsertServiceImage,
	upsertServiceLabel,
	upsertServiceLocation,
	upsertServiceLocationPrice,
	upsertServiceResourceRequirement,
	upsertServiceScheduleConfig,
	upsertTenant,
	upsertTenantBranding,
	upsertTenantBrandingLabels,
	upsertTenantImage,
	upsertTenantSettings
} from '../prisma/breezPrismaMutations.js';
import { runUpserts } from './loadMultiLocationGymTenant.js';
import { makeTestId } from './testIds.js';
import { environmentId, languages, locationId, tenantId } from '@breezbook/packages-types';
import {
	minimumNoticePeriod,
	scheduleConfig,
	singleDayScheduling,
	timeslot,
	timeslotSelection
} from '@breezbook/packages-core';
import { hours, time24 } from '@breezbook/packages-date-time';

const tenant_id = 'breezbook-clockwork-sleuths';
const environment_id = 'dev';

const locations = [
	{ name: 'London', slug: 'london', timezone: 'Europe/London' },
	{ name: 'New York', slug: 'new-york', timezone: 'America/New_York' },
	{ name: 'Tokyo', slug: 'tokyo', timezone: 'Asia/Tokyo' },
	{ name: 'Sydney', slug: 'sydney', timezone: 'Australia/Sydney' },
	{ name: 'Sao Paulo', slug: 'sao-paulo', timezone: 'America/Sao_Paulo' },
	{ name: 'Mumbai', slug: 'mumbai', timezone: 'Asia/Kolkata' },
	{ name: 'Cairo', slug: 'cairo', timezone: 'Africa/Cairo' },
	{ name: 'Anchorage', slug: 'anchorage', timezone: 'America/Anchorage' }
];

type LocationSlug = 'london' | 'new-york' | 'tokyo' | 'sydney' | 'sao-paulo' | 'mumbai' | 'cairo' | 'anchorage';

interface PriceInfo {
	amount: number;
	currency: string;
}

type ServicePrices = Record<LocationSlug, PriceInfo>;

const services = [
	{
		name: 'Temporal Alignment Consultation',
		slug: 'temporal-alignment',
		description: 'Expert consultation to align your personal timeline with the proper flow of time.',
		imageUrl: 'https://breezbook-playground.vercel.app/images/clockwork-sleuths/temporal-alignment.jpg',
		prices: {
			'london': { amount: 15000, currency: 'GBP' },
			'new-york': { amount: 18000, currency: 'USD' },
			'tokyo': { amount: 2000000, currency: 'JPY' },
			'sydney': { amount: 22000, currency: 'AUD' },
			'sao-paulo': { amount: 75000, currency: 'BRL' },
			'mumbai': { amount: 1100000, currency: 'INR' },
			'cairo': { amount: 235000, currency: 'EGP' },
			'anchorage': { amount: 17000, currency: 'USD' }
		} as ServicePrices
	},
	{
		name: 'Paradox Resolution',
		slug: 'paradox-resolution',
		description: 'Professional assistance in resolving temporal paradoxes and their consequences.',
		imageUrl: 'https://breezbook-playground.vercel.app/images/clockwork-sleuths/paradox-resolution.jpg',
		prices: {
			'london': { amount: 25000, currency: 'GBP' },
			'new-york': { amount: 30000, currency: 'USD' },
			'tokyo': { amount: 3300000, currency: 'JPY' },
			'sydney': { amount: 36000, currency: 'AUD' },
			'sao-paulo': { amount: 125000, currency: 'BRL' },
			'mumbai': { amount: 1800000, currency: 'INR' },
			'cairo': { amount: 390000, currency: 'EGP' },
			'anchorage': { amount: 28000, currency: 'USD' }
		} as ServicePrices
	},
	{
		name: 'Timeline Repair',
		slug: 'timeline-repair',
		description: 'Comprehensive service to repair damaged or altered timelines and restore proper chronological order.',
		imageUrl: 'https://breezbook-playground.vercel.app/images/clockwork-sleuths/timeline-repair.jpg',
		prices: {
			'london': { amount: 35000, currency: 'GBP' },
			'new-york': { amount: 42000, currency: 'USD' },
			'tokyo': { amount: 4600000, currency: 'JPY' },
			'sydney': { amount: 50000, currency: 'AUD' },
			'sao-paulo': { amount: 175000, currency: 'BRL' },
			'mumbai': { amount: 2500000, currency: 'INR' },
			'cairo': { amount: 545000, currency: 'EGP' },
			'anchorage': { amount: 39000, currency: 'USD' }
		} as ServicePrices
	}
] as const;

export const clockworkSleuthTenant = {
	tenantId: tenantId(tenant_id),
	environmentId: environmentId(environment_id),
	locations: Object.fromEntries(
		locations.map(loc => [loc.slug, locationId(makeTestId(tenant_id, environment_id, loc.slug))])
	),
	services: Object.fromEntries(
		services.map(service => [service.slug, makeTestId(tenant_id, environment_id, service.slug)])
	)
};

export async function loadClockworkSleuthTenant(prisma: PrismaClient): Promise<void> {
	await runUpserts(prisma, [
		upsertTenant({
			tenant_id,
			name: 'Clockwork Sleuths',
			slug: tenant_id
		})
	]);

	// Locations
	await runUpserts(prisma, locations.map(loc =>
		upsertLocation({
			id: makeTestId(tenant_id, environment_id, loc.slug),
			tenant_id,
			environment_id,
			name: loc.name,
			slug: loc.slug,
			iana_timezone: loc.timezone
		})
	));

	// Business Hours
	const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	await runUpserts(prisma, daysOfWeek.flatMap(day =>
		locations.map(loc =>
			upsertBusinessHours({
				id: makeTestId(tenant_id, environment_id, `business_hours.${loc.slug}.${day}`),
				tenant_id,
				environment_id,
				location_id: makeTestId(tenant_id, environment_id, loc.slug),
				day_of_week: day,
				start_time_24hr: '09:00',
				end_time_24hr: '18:00'
			})
		)
	));

	// Resource Types
	const resourceTypes = ['Sleuth', 'Assistant', 'Specialist'];
	const resourceTypeUpserts = await runUpserts(prisma, resourceTypes.map(type =>
		upsertResourceType({
			id: makeTestId(tenant_id, environment_id, `resource_type.${type.toLowerCase()}`),
			tenant_id,
			environment_id,
			name: type
		})
	));

	// Resources
	const resources = [
		{ name: 'Sherlock Holmes', type: 'Sleuth' },
		{ name: 'John Watson', type: 'Assistant' },
		{ name: 'Mycroft Holmes', type: 'Specialist' }
	];
	const resourceUpserts = await runUpserts(prisma, resources.map(resource =>
		upsertResource({
			id: makeTestId(tenant_id, environment_id, `resource.${resource.name.toLowerCase().replace(' ', '_')}`),
			tenant_id,
			environment_id,
			name: resource.name,
			resource_type_id: makeTestId(tenant_id, environment_id, `resource_type.${resource.type.toLowerCase()}`)
		})
	));

	// Resource Availability
	await runUpserts(prisma, resourceUpserts.flatMap(resource =>
		daysOfWeek.map(day =>
			upsertResourceAvailability({
				id: makeTestId(tenant_id, environment_id, `resource_availability.${resource.create.data.id}.${day}`),
				tenant_id,
				environment_id,
				resource_id: resource.create.data.id,
				day_of_week: day,
				start_time_24hr: '09:00',
				end_time_24hr: '18:00'
			})
		)
	));

	// Services
	const serviceUpserts = await runUpserts(prisma, services.map(service =>
		upsertService({
			id: makeTestId(tenant_id, environment_id, service.slug),
			tenant_id,
			environment_id,
			slug: service.slug
		})
	));

	// Service Schedule Configs
	await runUpserts(prisma, serviceUpserts.map(su =>
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, `service-schedule-config-${su.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: su.create.data.id,
			schedule_config: scheduleConfig(singleDayScheduling(
				timeslotSelection([
					timeslot(time24('09:00'), time24('13:00'), 'Morning'),
					timeslot(time24('13:00'), time24('18:00'), 'Afternoon')
				])), { minimumNoticePeriod: minimumNoticePeriod(hours(24)) }) as any
		})
	));

	// Service Labels
	await runUpserts(prisma, serviceUpserts.flatMap(su =>
		services.filter(s => makeTestId(tenant_id, environment_id, s.slug) === su.create.data.id)
			.map(s =>
				upsertServiceLabel({
					tenant_id,
					environment_id,
					service_id: su.create.data.id,
					language_id: languages.en.value,
					name: s.name,
					description: s.description
				})
			)
	));

	// Service Resource Requirements
	await runUpserts(prisma, serviceUpserts.map(su =>
		upsertServiceResourceRequirement({
			id: makeTestId(tenant_id, environment_id, `service-requirement-${su.create.data.id}`),
			service_id: su.create.data.id,
			tenant_id,
			environment_id,
			requirement_type: 'any_suitable',
			resource_type_id: resourceTypeUpserts[0].create.data.id // Assuming 'Sleuth' is the first resource type
		})
	));

	// Service Locations and Prices
	await runUpserts(prisma, serviceUpserts.flatMap(su =>
		locations.flatMap(loc => {
			const service = services.find(s => makeTestId(tenant_id, environment_id, s.slug) === su.create.data.id);
			const price = service?.prices[loc.slug as LocationSlug];
			return [
				upsertServiceLocation({
					tenant_id,
					environment_id,
					service_id: su.create.data.id,
					location_id: makeTestId(tenant_id, environment_id, loc.slug)
				}),

				upsertServiceLocationPrice({
					id: makeTestId(tenant_id, environment_id, `service-location-price-${su.create.data.id}-${loc.slug}`),
					tenant_id,
					environment_id,
					service_id: su.create.data.id,
					location_id: makeTestId(tenant_id, environment_id, loc.slug),
					price: price?.amount ?? 0,
					price_currency: price?.currency ?? 'GBP'
				})];
		})
	));

	// Tenant Branding
	const tenantBrandingId = makeTestId(tenant_id, environment_id, 'tenant_branding');
	await runUpserts(prisma, [
		upsertTenantBranding({
			id: tenantBrandingId,
			tenant_id,
			environment_id,
			theme: {}
		}),
		upsertTenantBrandingLabels({
			tenant_id,
			environment_id,
			language_id: languages.en.value,
			tenant_branding_id: tenantBrandingId,
			headline: 'Clockwork Sleuths',
			description: 'Solving temporal mysteries across the multiverse'
		})
	]);

	// Tenant Settings
	await runUpserts(prisma, [
		upsertTenantSettings({
			tenant_id,
			environment_id,
			customer_form_id: null
		})
	]);

	// Service Images
	await runUpserts(prisma, serviceUpserts.map(su => {
		const service = services.find(s => makeTestId(tenant_id, environment_id, s.slug) === su.create.data.id);
		return upsertServiceImage({
			tenant_id,
			environment_id,
			service_id: su.create.data.id,
			public_image_url: service?.imageUrl || `https://example.com/images/${su.create.data.id}.jpg`,
			mime_type: 'image/jpeg',
			context: 'thumbnail'
		});
	}));

	// Tenant Image
	await runUpserts(prisma, [
		upsertTenantImage({
			tenant_id,
			environment_id,
			public_image_url: 'https://example.com/images/clockwork-sleuths-hero.jpg',
			mime_type: 'image/jpeg',
			context: 'hero'
		})
	]);
}