import { Upsert } from '../mutation/mutations.js';
import {
	upsertBusinessHours,
	upsertForm,
	upsertFormLabels,
	upsertLocation,
	upsertPricingRule,
	upsertResource,
	upsertResourceAvailability,
	upsertResourceType,
	upsertService,
	upsertServiceForm,
	upsertServiceImage,
	upsertServiceLabel,
	upsertServiceLocation, upsertServiceLocationPrice,
	upsertServiceOption,
	upsertServiceOptionForm,
	upsertServiceOptionImage,
	upsertServiceOptionLabel,
	upsertServiceResourceRequirement,
	upsertServiceScheduleConfig,
	upsertServiceServiceOption,
	upsertTenant,
	upsertTenantBranding,
	upsertTenantBrandingLabels,
	upsertTenantSettings
} from '../prisma/breezPrismaMutations.js';
import { makeTestId } from './testIds.js';
import {
	environmentId,
	JsonSchemaForm,
	jsonSchemaFormLabels,
	languages,
	locationId,
	schemaKeyLabel,
	tenantEnvironment,
	tenantEnvironmentLocation,
	tenantId
} from '@breezbook/packages-types';
import { PrismaClient } from '@prisma/client';
import { runUpserts } from './loadMultiLocationGymTenant.js';
import {
	add,
	jexlExpression,
	jexlMutation,
	parameterisedPricingFactor,
	perHour,
	pricingFactorName,
	PricingRule
} from '@breezbook/packages-pricing';
import { consumesServiceCapacity, scheduleConfig, timeslot } from '@breezbook/packages-core';
import {
	singleDayScheduling,
	singleDaySchedulingFns,
	timeslotSelection
} from '@breezbook/packages-core/dist/scheduleConfig.js';
import { time24, minutes } from '@breezbook/packages-date-time';

const tenant_id = 'breezbook-dog-walks';
const environment_id = 'dev';
const mainLocationId = makeTestId(tenant_id, environment_id, 'main');

export const dogWalkingTenant = {
	tenantEnv: tenantEnvironment(environmentId(environment_id), tenantId(tenant_id)),
	tenantEnvLoc: tenantEnvironmentLocation(environmentId(environment_id), tenantId(tenant_id), locationId(mainLocationId)),
	serviceIds: {
		individualDogWalk: makeTestId(tenant_id, environment_id, 'individual_dog_walk'),
		groupDogWalk: makeTestId(tenant_id, environment_id, 'group_dog_walk'),
		dropInVisit: makeTestId(tenant_id, environment_id, 'drop_in_visit'),
		petSit: makeTestId(tenant_id, environment_id, 'pet_sit')
	},
	servicePrices: {
		individualDogWalk: 1500,
		groupDogWalk: 1200,
		dropInVisit: 1200,
		petSit: 2500
	},
	serviceOptions: {
		extra30Mins: makeTestId(tenant_id, environment_id, 'extra_30_minutes'),
		extra60Mins: makeTestId(tenant_id, environment_id, 'extra_60_minutes'),
		extraDog: makeTestId(tenant_id, environment_id, 'extra_dog.1')
	},
	serviceOptionPrices: {
		extra30Mins: 800,
		extra60Mins: 1200,
		extraDog: 800
	}
};

export async function loadDogWalkingTenant(prisma: PrismaClient): Promise<void> {
	await runUpserts(prisma, breezbookDogWalkUpserts());
}

function breezbookDogWalkUpserts(): Upsert[] {
	const mondayToFriday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
	const satSun = ['Saturday', 'Sunday'];
	const daysOfWeek = [...mondayToFriday, ...satSun];
	const start_time_24hr = '09:00';
	const end_time_24hr = '18:00';
	const dogWalkerResourceTypeId = makeTestId(tenant_id, environment_id, `resource_type.walker`);
	const resourceAlexId = makeTestId(tenant_id, environment_id, `resource.alex`);
	const tenantBrandingId = makeTestId(tenant_id, environment_id, `tenant_branding_${tenant_id}_${environment_id}`);

	return [

		upsertTenant({
			tenant_id,
			name: 'Breez Walks',
			slug: tenant_id
		}),
		upsertLocation({
			id: mainLocationId,
			tenant_id,
			environment_id,
			name: 'Main',
			slug: 'main',
			iana_timezone: 'Europe/London'
		}),
		...daysOfWeek.map(day => upsertBusinessHours({
			id: makeTestId(tenant_id, environment_id, `business_hours.${day}`),
			tenant_id,
			environment_id,
			day_of_week: day,
			start_time_24hr,
			end_time_24hr
		})),
		upsertResourceType({
			id: dogWalkerResourceTypeId,
			tenant_id,
			environment_id,
			name: 'Walker'
		}),
		upsertResource({
			id: resourceAlexId,
			tenant_id,
			environment_id,
			name: 'Alex',
			resource_type_id: dogWalkerResourceTypeId
		}),
		...daysOfWeek.map(day =>
			upsertResourceAvailability({
				id: makeTestId(tenant_id, environment_id, `resource_availability.alex.${day}`),
				tenant_id,
				environment_id,
				resource_id: resourceAlexId,
				day_of_week: day,
				start_time_24hr,
				end_time_24hr
			})),
		upsertForm({
			id: makeTestId(tenant_id, environment_id, 'pet-details-form'),
			tenant_id,
			environment_id,
			name: dogDetailsForm.name,
			description: dogDetailsForm.description ?? dogDetailsForm.name,
			definition: dogDetailsForm as any
		}),
		upsertFormLabels({
			tenant_id,
			environment_id,
			form_id: makeTestId(tenant_id, environment_id, 'pet-details-form'),
			language_id: languages.en.value,
			labels: dogDetailsFormLabelsEnglish as any
		}),
		upsertForm({
			id: makeTestId(tenant_id, environment_id, 'second-dog-details-form'),
			tenant_id,
			environment_id,
			name: secondDogDetailsForm.name,
			description: secondDogDetailsForm.description ?? secondDogDetailsForm.name,
			definition: secondDogDetailsForm as any
		}),
		upsertFormLabels({
			tenant_id,
			environment_id,
			form_id: makeTestId(tenant_id, environment_id, 'second-dog-details-form'),
			language_id: languages.en.value,
			labels: secondDogDetailsFormLabelsEnglish as any
		}),

		upsertServiceOption({
			id: dogWalkingTenant.serviceOptions.extra30Mins,
			tenant_id,
			environment_id,
			price: dogWalkingTenant.serviceOptionPrices.extra30Mins,
			price_currency: 'GBP',
			requires_quantity: false,
			duration_minutes: 30,
			service_impacts: []
		}),
		upsertServiceOption({
			id: dogWalkingTenant.serviceOptions.extra60Mins,
			tenant_id,
			environment_id,
			price: dogWalkingTenant.serviceOptionPrices.extra60Mins,
			price_currency: 'GBP',
			requires_quantity: false,
			duration_minutes: 60,
			service_impacts: []
		}),
		upsertServiceOption({
			id: dogWalkingTenant.serviceOptions.extraDog,
			tenant_id,
			environment_id,
			price: dogWalkingTenant.serviceOptionPrices.extraDog,
			price_currency: 'GBP',
			requires_quantity: false,
			duration_minutes: 0,
			service_impacts: [consumesServiceCapacity('quantity')] as any
		}),
		upsertServiceOptionImage({
			tenant_id,
			environment_id,
			service_option_id: dogWalkingTenant.serviceOptions.extraDog,
			public_image_url: 'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/breezbook-dog-walks/extra_dog.jpg',
			mime_type: 'image/jpeg',
			context: 'thumbnail'
		}),
		upsertServiceOptionImage({
			tenant_id,
			environment_id,
			service_option_id: dogWalkingTenant.serviceOptions.extra30Mins,
			public_image_url: 'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/breezbook-dog-walks/clock.jpg',
			mime_type: 'image/jpeg',
			context: 'thumbnail'
		}),
		upsertServiceOptionImage({
			tenant_id,
			environment_id,
			service_option_id: dogWalkingTenant.serviceOptions.extra60Mins,
			public_image_url: 'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/breezbook-dog-walks/clock.jpg',
			mime_type: 'image/jpeg',
			context: 'thumbnail'
		}),
		upsertServiceOptionForm({
			tenant_id,
			environment_id,
			service_option_id: makeTestId(tenant_id, environment_id, 'extra_dog.1'),
			form_id: makeTestId(tenant_id, environment_id, 'second-dog-details-form'),
			rank: 0
		}),

		upsertServiceOptionLabel({
			tenant_id,
			environment_id,
			service_option_id: dogWalkingTenant.serviceOptions.extra30Mins,
			language_id: languages.en.value,
			name: 'Extra 30 minutes',
			description: 'Add 30 minutes to your dog walk'
		}),
		upsertServiceOptionLabel({
			tenant_id,
			environment_id,
			service_option_id: dogWalkingTenant.serviceOptions.extra60Mins,
			language_id: languages.en.value,
			name: 'Extra 60 minutes',
			description: 'Add 60 minutes to your dog walk'
		}),
		upsertServiceOptionLabel({
			tenant_id,
			environment_id,
			service_option_id: dogWalkingTenant.serviceOptions.extraDog,
			language_id: languages.en.value,
			name: 'Extra dog from the same household',
			description: 'Add an extra dog from the same household'
		}),

		upsertService({
			tenant_id,
			environment_id,
			id: dogWalkingTenant.serviceIds.individualDogWalk,
			slug: 'individual_dog_walk',
		}),
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, 'individual_dog_walk_schedule_config'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.individualDogWalk,
			schedule_config: scheduleConfig(singleDaySchedulingFns.pickTime({
				startTime: time24('11:00'),
				endTime: time24('16:00'),
				duration: minutes(60),
				period: minutes(30)
			})) as any
		}),
		upsertServiceImage({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.individualDogWalk,
			public_image_url: 'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/breezbook-dog-walks/individual_dog_walk.jpg',
			mime_type: 'image/jpeg',
			context: 'thumbnail'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.individualDogWalk,
			language_id: languages.en.value,
			name: 'Individual dog walk',
			description: 'A 60-min walk for your dog'
		}),
		upsertServiceServiceOption({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.individualDogWalk,
			service_option_id: dogWalkingTenant.serviceOptions.extra30Mins
		}),
		upsertServiceServiceOption({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.individualDogWalk,
			service_option_id: dogWalkingTenant.serviceOptions.extra60Mins
		}),
		upsertServiceServiceOption({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.individualDogWalk,
			service_option_id: dogWalkingTenant.serviceOptions.extraDog
		}),

		upsertService({
			tenant_id,
			environment_id,
			id: dogWalkingTenant.serviceIds.groupDogWalk,
			slug: 'group_dog_walk',
			capacity: 5
		}),
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, 'group_dog_walk_schedule_config'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.groupDogWalk,
			schedule_config: scheduleConfig(singleDayScheduling(
				timeslotSelection([
					timeslot(time24('09:00'), time24('10:00'), 'Morning walk'),
					timeslot(time24('17:00'), time24('18:00'), 'Evening walk')
				]))) as any
		}),
		upsertServiceImage({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.groupDogWalk,
			public_image_url: 'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/breezbook-dog-walks/group_dog_walk.jpg',
			mime_type: 'image/jpeg',
			context: 'thumbnail'
		}),
		upsertServiceServiceOption({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.groupDogWalk,
			service_option_id: dogWalkingTenant.serviceOptions.extraDog
		}),

		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.groupDogWalk,
			language_id: languages.en.value,
			name: 'Group dog walk',
			description: 'A 60-min walk for your dog with 3 - 5 other dogs'
		}),

		upsertService({
			tenant_id,
			environment_id,
			id: dogWalkingTenant.serviceIds.dropInVisit,
			slug: 'drop_in_visit'
		}),
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, 'drop_in_visit_schedule_config'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.dropInVisit,
			schedule_config: scheduleConfig(singleDaySchedulingFns.pickTime({
				startTime: time24('11:00'),
				endTime: time24('16:00'),
				duration: minutes(30),
				period: minutes(30)
			})) as any
		}),
		upsertServiceImage({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.dropInVisit,
			public_image_url: 'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/breezbook-dog-walks/drop_in_visit.jpg',
			mime_type: 'image/jpeg',
			context: 'thumbnail'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.dropInVisit,
			language_id: languages.en.value,
			name: 'Drop in visit',
			description: 'We will visit your dog in your home for a quick check-in and playtime'
		}),
		upsertServiceServiceOption({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.dropInVisit,
			service_option_id: dogWalkingTenant.serviceOptions.extra30Mins
		}),


		upsertService({
			tenant_id,
			environment_id,
			id: dogWalkingTenant.serviceIds.petSit,
			slug: 'pet_sit'
		}),
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, 'pet_sit_schedule_config'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.petSit,
			schedule_config: scheduleConfig(singleDaySchedulingFns.pickTime({
				startTime: time24('11:00'),
				endTime: time24('16:00'),
				duration: minutes(120),
				period: minutes(30)
			})) as any
		}),
		upsertServiceImage({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.petSit,
			public_image_url: 'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/breezbook-dog-walks/pet_sit.jpg',
			mime_type: 'image/jpeg',
			context: 'thumbnail'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.petSit,
			language_id: languages.en.value,
			name: 'Pet sit',
			description: 'We will stay with your dog in your home'
		}),
		upsertServiceServiceOption({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.petSit,
			service_option_id: dogWalkingTenant.serviceOptions.extra30Mins
		}),
		upsertServiceServiceOption({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.petSit,
			service_option_id: dogWalkingTenant.serviceOptions.extra60Mins
		}),
		upsertServiceResourceRequirement({
			id: makeTestId(tenant_id, environment_id, 'pet_sit_requirement'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.petSit,
			requirement_type: 'any_suitable',
			resource_type_id: dogWalkerResourceTypeId
		}),
		upsertServiceResourceRequirement({
			id: makeTestId(tenant_id, environment_id, 'group_dog_walk_requirement'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.groupDogWalk,
			requirement_type: 'any_suitable',
			resource_type_id: dogWalkerResourceTypeId
		}),
		upsertServiceResourceRequirement({
			id: makeTestId(tenant_id, environment_id, 'individual_dog_walk_requirement'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.individualDogWalk,
			requirement_type: 'any_suitable',
			resource_type_id: dogWalkerResourceTypeId
		}),
		upsertServiceResourceRequirement({
			id: makeTestId(tenant_id, environment_id, 'drop_in_visit_requirement'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.dropInVisit,
			requirement_type: 'any_suitable',
			resource_type_id: dogWalkerResourceTypeId
		}),

		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.individualDogWalk,
			location_id: makeTestId(tenant_id, environment_id, 'main')
		}),
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.groupDogWalk,
			location_id: makeTestId(tenant_id, environment_id, 'main')
		}),
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.dropInVisit,
			location_id: makeTestId(tenant_id, environment_id, 'main')
		}),
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.petSit,
			location_id: makeTestId(tenant_id, environment_id, 'main')
		}),

		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, 'service_location_price.individual_dog_walk'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.individualDogWalk,
			location_id: mainLocationId,
			price: dogWalkingTenant.servicePrices.individualDogWalk,
			price_currency: 'GBP'
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, 'service_location_price.group_dog_walk'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.groupDogWalk,
			location_id: mainLocationId,
			price: dogWalkingTenant.servicePrices.groupDogWalk,
			price_currency: 'GBP'
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, 'service_location_price.drop_in_visit'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.dropInVisit,
			location_id: mainLocationId,
			price: dogWalkingTenant.servicePrices.dropInVisit,
			price_currency: 'GBP'
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, 'service_location_price.pet_sit'),
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.petSit,
			location_id: mainLocationId,
			price: dogWalkingTenant.servicePrices.petSit,
			price_currency: 'GBP'
		}),



		upsertServiceForm({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.individualDogWalk,
			form_id: makeTestId(tenant_id, environment_id, 'pet-details-form'),
			rank: 0
		}),
		upsertServiceForm({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.groupDogWalk,
			form_id: makeTestId(tenant_id, environment_id, 'pet-details-form'),
			rank: 0
		}),
		upsertServiceForm({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.dropInVisit,
			form_id: makeTestId(tenant_id, environment_id, 'pet-details-form'),
			rank: 0
		}),
		upsertServiceForm({
			tenant_id,
			environment_id,
			service_id: dogWalkingTenant.serviceIds.petSit,
			form_id: makeTestId(tenant_id, environment_id, 'pet-details-form'),
			rank: 0
		}),

		upsertTenantBranding({
				id: tenantBrandingId,
				tenant_id,
				environment_id,
				theme: {}
			}
		),
		upsertTenantBrandingLabels({
			tenant_id,
			environment_id,
			language_id: languages.en.value,
			tenant_branding_id: tenantBrandingId,
			headline: 'Breez Walks',
			description: 'Where dog walking is a breez'
		}),
		upsertTenantSettings({
			tenant_id,
			environment_id,
			customer_form_id: null
		}),

		upsertPricingRule({
			id: makeTestId(tenant_id, environment_id, `pricing_rule.addMoreForWeekend`),
			tenant_id,
			environment_id,
			rank: 0,
			active: true,
			definition: addMoreForWeekend as any
		}),
		upsertPricingRule({
			id: makeTestId(tenant_id, environment_id, `pricing_rule.moreExpensiveOnHolidays`),
			tenant_id,
			environment_id,
			rank: 1,
			active: true,
			definition: moreExpensiveOnHolidays as any
		}),
		upsertPricingRule({
			id: makeTestId(tenant_id, environment_id, `pricing_rule.addMoreForEvening`),
			tenant_id,
			environment_id,
			rank: 2,
			active: true,
			definition: addMoreForEvening as any
		})
	];
}

const dogDetailsForm: JsonSchemaForm = {
	'_type': 'json.schema.form',
	'id': {
		'_type': 'form.id',
		'value': 'pet-details-form'
	},
	'name': 'Your dog\'s details',
	'schema': {
		'$schema': 'http://json-schema.org/draft-07/schema#',
		'type': 'object',
		'properties': {
			'dogsName': {
				'type': 'string'
			}
		},
		'required': [
			'dogsName'
		],
		'additionalProperties': false
	}
};

const secondDogDetailsForm: JsonSchemaForm = {
	'_type': 'json.schema.form',
	'id': {
		'_type': 'form.id',
		'value': 'second-dog-details-form'
	},
	'name': 'Your second dog\'s details',
	'schema': {
		'$schema': 'http://json-schema.org/draft-07/schema#',
		'type': 'object',
		'properties': {
			'secondDogsName': {
				'type': 'string'
			}
		},
		'required': [
			'secondDogsName'
		],
		'additionalProperties': false
	}
};

const dogDetailsFormLabelsEnglish = jsonSchemaFormLabels(dogDetailsForm.id, languages.en, 'Your dog\'s details',
	[schemaKeyLabel('dogsName', 'Dog\'s name')]);

const secondDogDetailsFormLabelsEnglish = jsonSchemaFormLabels(secondDogDetailsForm.id, languages.en, 'Your second dog\'s details', [
	schemaKeyLabel('secondDogsName', 'Second dog\'s name')
], 'Your second dog\'s name');

const addMoreForWeekend: PricingRule = {
	id: 'add-more-for-weekend',
	name: 'Add More For Weekend',
	description: 'Add more for weekend',
	requiredFactors: [pricingFactorName('dayOfWeek')],
	context: {
		weekendDays: ['Saturday', 'Sunday']
	},
	mutations: [
		{
			condition: jexlExpression('weekendDays | includes(dayOfWeek)'),
			mutation: perHour(add(200)),
			description: 'Add £2 per-hour on weekends'
		}
	],
	applyAllOrFirst: 'all'
};

const moreExpensiveOnHolidays: PricingRule = {
	id: 'more-expensive-on-holidays',
	name: '1.5x The Price On Holidays',
	description: '1.5x the price on holidays',
	context: {
		holidays: [
			'2024-01-01',
			'2024-03-29',
			'2024-04-01',
			'2024-05-06',
			'2024-05-27',
			'2024-08-26',
			'2024-12-25',
			'2024-12-26',
			'2025-01-01',
			'2025-04-18',
			'2025-04-21',
			'2025-05-05',
			'2025-05-26',
			'2025-08-25',
			'2025-12-25',
			'2025-12-26'
		]
	},
	requiredFactors: [pricingFactorName('bookingDate')],
	mutations: [
		{
			condition: jexlExpression('holidays | includes(bookingDate)'),
			mutation: jexlMutation('currentPrice * 1.5'),
			description: '1.5x the price on holidays'
		}
	],
	applyAllOrFirst: 'all'
};

const addMoreForEvening: PricingRule = {
	id: 'add-more-for-evening',
	name: 'Add More For Evening',
	description: 'Add more for evening hours between 18:00 and 24:00',
	requiredFactors: [
		parameterisedPricingFactor('hourCount', 'numberOfEveningHours', {
			startingTime: time24('18:00'),
			endingTime: time24('24:00')
		})
	],
	mutations: [
		{
			condition: jexlExpression('numberOfEveningHours > 0'),
			mutation: add(jexlExpression('numberOfEveningHours * 100')),
			description: 'Add £1 per-hour for evening bookings'
		}
	],
	applyAllOrFirst: 'all'
};

