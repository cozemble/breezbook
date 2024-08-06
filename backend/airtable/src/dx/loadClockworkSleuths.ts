import { Upsert } from '../mutation/mutations.js';
import {
	upsertBusinessHours,
	upsertLocation, upsertResource, upsertResourceAvailability, UpsertResourceAvailability,
	upsertResourceType, upsertService, upsertServiceLabel, upsertServiceLocationPrice, upsertServiceResourceRequirement,
	upsertTenant
} from '../prisma/breezPrismaMutations.js';
import { makeTestId } from './testIds.js';

const tenant_id = 'breezbook-clockwork-sleuths';
const environment_id = 'development';

const mondayToFriday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const satSun = ['Saturday', 'Sunday'];
const daysOfWeek = [...mondayToFriday, ...satSun];
const start_time_24hr = '09:00';
const end_time_24hr = '18:00';
const sleuthResourceTypeId = makeTestId(tenant_id, environment_id, `resource_type.sleuth`);

function resourceAlwaysAvailable(resourceShortId: string, locationShortId: string):UpsertResourceAvailability[] {
	const resource_id = makeTestId(tenant_id, environment_id, resourceShortId);
	const location_id = makeTestId(tenant_id, environment_id, locationShortId);
	return daysOfWeek.map(day => upsertResourceAvailability({
		id: makeTestId(tenant_id, environment_id, `resource_availability.${resourceShortId}.${locationShortId}.${day}`),
		tenant_id,
		environment_id,
		resource_id,
		location_id,
		day_of_week: day,
		start_time_24hr,
		end_time_24hr
	}))
}

function clockworkSleuthUpserts(): Upsert[] {


	return [
		upsertTenant({
			tenant_id,
			name: 'Clockwork Sleuths',
			slug: tenant_id
		}),
		upsertLocation({
			id: makeTestId(tenant_id, environment_id, 'location_london'),
			tenant_id,
			environment_id,
			name: 'London',
			slug: 'london',
			iana_timezone: 'Europe/London'
		}),
		upsertLocation({
			id: makeTestId(tenant_id, environment_id, 'location_new_york'),
			tenant_id,
			environment_id,
			name: 'New York',
			slug: 'new_york',
			iana_timezone: 'America/New_York'
		}),
		upsertLocation({
			id: makeTestId(tenant_id, environment_id, 'location_tokyo'),
			tenant_id,
			environment_id,
			name: 'Tokyo',
			slug: 'tokyo',
			iana_timezone: 'Asia/Tokyo'
		}),
		upsertLocation({
			id: makeTestId(tenant_id, environment_id, 'location_sydney'),
			tenant_id,
			environment_id,
			name: 'Sydney',
			slug: 'sydney',
			iana_timezone: 'Australia/Sydney'
		}),
		upsertLocation({
			id: makeTestId(tenant_id, environment_id, 'location_sao_paulo'),
			tenant_id,
			environment_id,
			name: 'Sao Paulo',
			slug: 'sao_paulo',
			iana_timezone: 'America/Sao_Paulo'
		}),
		upsertLocation({
			id: makeTestId(tenant_id, environment_id, 'location_mumbai'),
			tenant_id,
			environment_id,
			name: 'Mumbai',
			slug: 'mumbai',
			iana_timezone: 'Asia/Kolkata'
		}),
		upsertLocation({
			id: makeTestId(tenant_id, environment_id, 'location_cairo'),
			tenant_id,
			environment_id,
			name: 'Cairo',
			slug: 'cairo',
			iana_timezone: 'Africa/Cairo'
		}),
		upsertLocation({
			id: makeTestId(tenant_id, environment_id, 'location_anchorage'),
			tenant_id,
			environment_id,
			name: 'Anchorage',
			slug: 'anchorage',
			iana_timezone: 'America/Anchorage'
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
			id: sleuthResourceTypeId,
			tenant_id,
			environment_id,
			name: 'Sleuth'
		}),

		upsertResource({
			id: makeTestId(tenant_id, environment_id, 'resource.reginald_pendleton'),
			tenant_id,
			environment_id,
			name: 'Chief Inspector Reginald Pendleton',
			resource_type_id: sleuthResourceTypeId
		}),
		...resourceAlwaysAvailable('resource.reginald_pendleton', 'location_london'),

		upsertResource({
			id: makeTestId(tenant_id, environment_id, 'resource.zoe_rodriguez'),
			tenant_id,
			environment_id,
			name: 'Detective Zoe "Tick-Tock" Rodriguez',
			resource_type_id: sleuthResourceTypeId
		}),
		...resourceAlwaysAvailable('resource.zoe_rodriguez', 'location_new_york'),

		upsertResource({
			id: makeTestId(tenant_id, environment_id, 'resource.kazuo_takahashi'),
			tenant_id,
			environment_id,
			name: 'Inspector Kazuo Takahashi',
			resource_type_id: sleuthResourceTypeId
		}),
		...resourceAlwaysAvailable('resource.kazuo_takahashi', 'location_tokyo'),

		upsertResource({
			id: makeTestId(tenant_id, environment_id, 'resource.jasmine_singh'),
			tenant_id,
			environment_id,
			name: 'Inspector Jasmine Singh',
			resource_type_id: sleuthResourceTypeId
		}),
		...resourceAlwaysAvailable('resource.jasmine_singh', 'location_sydney'),

		upsertResource({
			id: makeTestId(tenant_id, environment_id, 'resource.rafael_santos'),
			tenant_id,
			environment_id,
			name: 'Inspector Rafael Santos',
			resource_type_id: sleuthResourceTypeId
		}),
		...resourceAlwaysAvailable('resource.rafael_santos', 'location_sao_paulo'),

		upsertResource({
			id: makeTestId(tenant_id, environment_id, 'resource.ishaan_sharma'),
			tenant_id,
			environment_id,
			name: 'Inspector Ishaan Sharma',
			resource_type_id: sleuthResourceTypeId
		}),
		...resourceAlwaysAvailable('resource.ishaan_sharma', 'location_mumbai'),

		upsertResource({
			id: makeTestId(tenant_id, environment_id, 'resource.sarah_mahmoud'),
			tenant_id,
			environment_id,
			name: 'Detective Sarah Mahmoud',
			resource_type_id: sleuthResourceTypeId
		}),
		...resourceAlwaysAvailable('resource.sarah_mahmoud', 'location_cairo'),

		upsertResource({
			id: makeTestId(tenant_id, environment_id, 'resource.jack_frost'),
			tenant_id,
			environment_id,
			name: 'Inspector Jack Frost',
			resource_type_id: sleuthResourceTypeId
		}),
		...resourceAlwaysAvailable('resource.jack_frost', 'location_anchorage'),

		upsertService({
			id: makeTestId(tenant_id, environment_id, 'service.tac'),
			tenant_id,
			environment_id,
			slug: 'tac',
			// price: 6600,
			// price_currency: 'GBP',
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, 'service_location_price.tac.london'),
			tenant_id,
			environment_id,
			service_id: makeTestId(tenant_id, environment_id, 'service.tac'),
			location_id: makeTestId(tenant_id, environment_id, 'location_london'),
			price: 6600,
			price_currency: 'GBP',
		}),

		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: makeTestId(tenant_id, environment_id, 'service.tac'),
			language_id: 'en',
			name: 'Temporal Alignment Consultation',
			description: 'Helps clients navigate and resolve timezone-related issues',
		}),
		upsertServiceResourceRequirement({
			id: makeTestId(tenant_id, environment_id, 'service_resource_requirement.tac'),
			tenant_id,
			environment_id,
			service_id: makeTestId(tenant_id, environment_id, 'service.tac'),
			requirement_type:'any_suitable',
			resource_type_id: sleuthResourceTypeId,
		})




	];
}