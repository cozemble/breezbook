import { PrismaClient } from '@prisma/client';
import {
	upsertBusinessHours,
	upsertForm,
	upsertFormLabels,
	upsertLocation,
	upsertResource,
	upsertResourceAvailability,
	upsertResourceType,
	upsertService,
	upsertServiceForm,
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
import {
	environmentId,
	JsonSchemaForm,
	jsonSchemaFormLabels,
	languages,
	locationId,
	schemaKeyLabel,
	tenantId
} from '@breezbook/packages-types';
import { scheduleConfig, singleDayScheduling, timeslot, timeslotSelection } from '@breezbook/packages-core';
import { time24 } from '@breezbook/packages-date-time';

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

const services = [
	{ 
		name: 'Temporal Alignment Consultation', 
		slug: 'temporal-alignment', 
		price: 15000,
		description: 'Expert consultation to align your personal timeline with the proper flow of time.',
		imageUrl: 'https://example.com/images/temporal-alignment.jpg'
	},
	{ 
		name: 'Paradox Resolution', 
		slug: 'paradox-resolution', 
		price: 25000,
		description: 'Professional assistance in resolving temporal paradoxes and their consequences.',
		imageUrl: 'https://example.com/images/paradox-resolution.jpg'
	},
	{ 
		name: 'Timeline Repair', 
		slug: 'timeline-repair', 
		price: 35000,
		description: 'Comprehensive service to repair damaged or altered timelines and restore proper chronological order.',
		imageUrl: 'https://example.com/images/timeline-repair.jpg'
	}
];

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
			schedule_config: scheduleConfig(singleDayScheduling(timeslotSelection([
				timeslot(time24('09:00'), time24('13:00'), 'Morning'),
				timeslot(time24('13:00'), time24('18:00'), 'Afternoon')
			]))) as any
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
		locations.map(loc =>
			upsertServiceLocation({
				tenant_id,
				environment_id,
				service_id: su.create.data.id,
				location_id: makeTestId(tenant_id, environment_id, loc.slug)
			})
		)
	));

	await runUpserts(prisma, serviceUpserts.flatMap(su =>
		locations.map(loc =>
			upsertServiceLocationPrice({
				id: makeTestId(tenant_id, environment_id, `service-location-price-${su.create.data.id}-${loc.slug}`),
				tenant_id,
				environment_id,
				service_id: su.create.data.id,
				location_id: makeTestId(tenant_id, environment_id, loc.slug),
				price: services.find(s => makeTestId(tenant_id, environment_id, s.slug) === su.create.data.id)?.price ?? 0,
				price_currency: 'GBP'
			})
		)
	));

	// Forms
	const caseDetailsForm: JsonSchemaForm = {
		'_type': 'json.schema.form',
		'id': {
			'_type': 'form.id',
			'value': 'case-details-form'
		},
		'name': 'Case Details Form',
		'schema': {
			'$schema': 'http://json-schema.org/draft-07/schema#',
			'type': 'object',
			'properties': {
				'caseTitle': {
					'type': 'string'
				},
				'caseDescription': {
					'type': 'string'
				},
				'timelineAffected': {
					'type': 'string'
				}
			},
			'required': [
				'caseTitle',
				'caseDescription',
				'timelineAffected'
			],
			'additionalProperties': false
		}
	};

	const [caseDetailsFormUpsert] = await runUpserts(prisma, [
		upsertForm({
			id: makeTestId(tenant_id, environment_id, caseDetailsForm.id.value),
			tenant_id,
			environment_id,
			name: caseDetailsForm.name,
			description: caseDetailsForm.name,
			definition: caseDetailsForm as any
		})
	]);

	// Form Labels
	await runUpserts(prisma, [
		upsertFormLabels({
			tenant_id,
			environment_id,
			form_id: caseDetailsFormUpsert.create.data.id,
			language_id: languages.en.value,
			labels: jsonSchemaFormLabels(
				caseDetailsForm.id,
				languages.en,
				'Case Details',
				[
					schemaKeyLabel('caseTitle', 'Case Title'),
					schemaKeyLabel('caseDescription', 'Case Description'),
					schemaKeyLabel('timelineAffected', 'Affected Timeline')
				],
				'Please provide details about your case'
			) as any
		})
	]);

	// Service Forms
	await runUpserts(prisma, serviceUpserts.map(su =>
		upsertServiceForm({
			tenant_id,
			environment_id,
			service_id: su.create.data.id,
			form_id: caseDetailsFormUpsert.create.data.id,
			rank: 0
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