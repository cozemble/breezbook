import { PrismaClient } from '@prisma/client';
import {
	makeId,
	upsertBlockedTime,
	upsertBusinessHours,
	upsertForm,
	upsertFormLabels,
	upsertLocation,
	upsertPackage,
	upsertPackageLabel,
	upsertPackageLocation,
	upsertPackageLocationPrice,
	upsertPricingRule,
	upsertResource,
	upsertResourceAvailability,
	upsertResourceImage,
	upsertResourceMarkup,
	upsertResourceMarkupLabels,
	upsertResourceType,
	upsertService,
	upsertServiceForm,
	upsertServiceLabel,
	upsertServiceLocation,
	upsertServiceLocationPrice,
	upsertServiceResourceRequirement,
	upsertServiceScheduleConfig,
	upsertTenant,
	upsertTenantBranding,
	upsertTenantBrandingLabels,
	upsertTenantSettings
} from '../prisma/breezPrismaMutations.js';
import { prismaMutationToPromise } from '../infra/prismaMutations.js';
import { Upsert } from '../mutation/mutations.js';
import { JsonSchemaForm, jsonSchemaFormLabels, languages, schemaKeyLabel, serviceId } from '@breezbook/packages-types';
import { add, jexlExpression, pricingFactorName, PricingRule } from '@breezbook/packages-pricing';
import { makeTestId } from './testIds.js';
import {
	createPackage,
	currencies,
	price,
	scheduleConfig,
	serviceCredit,
	simpleScheduleConfig
} from '@breezbook/packages-core';
import { duration, minutes, weeks } from '@breezbook/packages-date-time';

const tenant_id = 'breezbook-gym';
const environment_id = 'dev';
const locationLondon = makeTestId(tenant_id, environment_id, 'europe.uk.london');
const locationLiverpool = makeTestId(tenant_id, environment_id, 'europe.uk.liverpool');
const locationManchester = makeTestId(tenant_id, environment_id, 'europe.uk.manchester');
const resourceTypes = ['personal.trainer', 'massage.therapist', 'yoga.instructor'];

const locationUpserts = [
	upsertLocation({
		id: locationLondon,
		tenant_id,
		environment_id,
		name: 'London',
		slug: 'london',
		iana_timezone: 'Europe/London'
	}),
	upsertLocation({
		id: locationLiverpool,
		tenant_id,
		environment_id,
		name: 'Liverpool',
		slug: 'liverpool',
		iana_timezone: 'Europe/London'
	}),
	upsertLocation({
		id: locationManchester,
		tenant_id,
		environment_id,
		name: 'Manchester',
		slug: 'manchester',
		iana_timezone: 'Europe/London'
	})
];

const resourceTypeUpserts = resourceTypes.map((resourceType) =>
	upsertResourceType({
		id: makeTestId(tenant_id, environment_id, `resource_type.${resourceType}`),
		tenant_id,
		environment_id,
		name: resourceType
	})
);
const personalTrainerResourceTypeId = resourceTypeUpserts[0].create.data.id;
const massageTherapistResourceTypeId = resourceTypeUpserts[1].create.data.id;
const yogaInstructorResourceTypeId = resourceTypeUpserts[2].create.data.id;

const personalTrainerUpserts = [
	upsertResource({
		id: makeTestId(tenant_id, environment_id, `resource.ptMike`),
		tenant_id,
		environment_id,
		name: 'Mike',
		resource_type_id: personalTrainerResourceTypeId
	}),
	upsertResource({
		id: makeTestId(tenant_id, environment_id, `resource.ptMete`),
		tenant_id,
		environment_id,
		name: 'Mete',
		resource_type_id: personalTrainerResourceTypeId,
		metadata: {
			tier: 'elite'
		}
	})
];
const upsertPtMike = personalTrainerUpserts[0];
const upsertPtMete = personalTrainerUpserts[1];

const serviceUpserts = [
	upsertService({
		id: makeTestId(tenant_id, environment_id, 'gym.service.1hr'),
		tenant_id,
		environment_id,
		slug: 'gym1hr'
	}),
	upsertService({
		id: makeTestId(tenant_id, environment_id, 'pt.service.1hr'),
		tenant_id,
		environment_id,
		slug: 'pt1hr'
	}),
	upsertService({
		id: makeTestId(tenant_id, environment_id, 'yoga.1to1.1hr'),
		tenant_id,
		environment_id,
		slug: 'yoga.1to1.1hr'
	}),
	upsertService({
		id: makeTestId(tenant_id, environment_id, 'massage.30mins'),
		tenant_id,
		environment_id,
		slug: 'massage.30mins'
	}),
	upsertService({
		id: makeTestId(tenant_id, environment_id, 'swim.30mins'),
		tenant_id,
		environment_id,
		slug: 'swim.30mins'
	}),
	upsertService({
		id: makeTestId(tenant_id, environment_id, 'boxing.1hr'),
		tenant_id,
		environment_id,
		slug: 'boxing.1hr'
	})
];


const [gym1Hr, pt1Hr, yoga1Hr, massage30mins, swim30mins, boxing1Hr] = serviceUpserts;


export const multiLocationGym = {
	tenant_id,
	environment_id,
	locationLondon,
	locationLiverpool,
	locationManchester,
	gym1Hr: gym1Hr.create.data.id,
	pt1Hr: pt1Hr.create.data.id,
	yoga1Hr: yoga1Hr.create.data.id,
	massage30mins: massage30mins.create.data.id,
	swim30mins: swim30mins.create.data.id,
	ptMike: upsertPtMike.create.data.id,
	ptMete: upsertPtMete.create.data.id,
	boxing1Hr: boxing1Hr.create.data.id
};

export async function runUpserts(prisma: PrismaClient, upserts: Upsert[]): Promise<Upsert[]> {
	for (const upsert of upserts) {
		await prismaMutationToPromise(prisma, upsert);
	}
	return upserts;
}

export async function loadMultiLocationGymTenant(prisma: PrismaClient): Promise<void> {
	const en = languages.en.value;
	const tr = languages.tr.value;

	await runUpserts(prisma, [
		upsertTenant({
			tenant_id,
			name: 'Multi-location Gym',
			slug: tenant_id
		})
	]);
	await runUpserts(prisma, locationUpserts);

	const mondayToFriday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
	const satSun = ['Saturday', 'Sunday'];
	const daysOfWeek = [...mondayToFriday, ...satSun];
	const start_time_24hr = '09:00';
	const end_time_24hr = '18:00';
	const businessHourUpserts = daysOfWeek.map((day) =>
		upsertBusinessHours({
			id: makeTestId(tenant_id, environment_id, `business_hours.${day}`),
			tenant_id,
			environment_id,
			day_of_week: day,
			start_time_24hr,
			end_time_24hr
		})
	);
	// Let's make harlow closed on Wednesdays
	const daysLessWednesday = daysOfWeek.filter((day) => day !== 'Wednesday');
	const harlowBusinessHourUpserts = daysLessWednesday.map((day) =>
		upsertBusinessHours({
			id: makeTestId(tenant_id, environment_id, `business_hours.${day}.harlow`),
			tenant_id,
			environment_id,
			day_of_week: day,
			start_time_24hr,
			end_time_24hr,
			location_id: locationLondon
		})
	);
	await runUpserts(prisma, [...businessHourUpserts, ...harlowBusinessHourUpserts]);

	// everywhere is closed on Christmas day, and London on the 26th in addition
	const blockedTimeUpserts = [
		upsertBlockedTime({
			id: makeTestId(tenant_id, environment_id, `blocked_time.christmas.1`),
			tenant_id,
			environment_id,
			location_id: locationLondon,
			date: '2024-12-25',
			start_time_24hr,
			end_time_24hr
		}),
		upsertBlockedTime({
			id: makeTestId(tenant_id, environment_id, `blocked_time.christmas.2`),
			tenant_id,
			environment_id,
			location_id: locationLondon,
			date: '2024-12-26',
			start_time_24hr,
			end_time_24hr
		}),
		upsertBlockedTime({
			id: makeTestId(tenant_id, environment_id, `blocked_time.christmas.3`),
			tenant_id,
			environment_id,
			location_id: locationLiverpool,
			date: '2024-12-25',
			start_time_24hr,
			end_time_24hr
		}),
		upsertBlockedTime({
			id: makeTestId(tenant_id, environment_id, `blocked_time.christmas.4`),
			tenant_id,
			environment_id,
			location_id: locationManchester,
			date: '2024-12-25',
			start_time_24hr,
			end_time_24hr
		})
	];
	await runUpserts(prisma, blockedTimeUpserts);

	await runUpserts(prisma, resourceTypeUpserts);

	await runUpserts(prisma, personalTrainerUpserts);
	await runUpserts(prisma, [
		upsertPricingRule({
			id: makeTestId(tenant_id, environment_id, `pricing_rule.eliteIsMoreExpensive`),
			tenant_id,
			environment_id,
			rank: 0,
			active: true,
			definition: eliteIsMoreExpensive as any
		})
	]);
	await runUpserts(prisma, [
		upsertResourceImage({
			resource_id: upsertPtMike.create.data.id,
			tenant_id,
			environment_id,
			public_image_url: 'https://pbs.twimg.com/profile_images/1783563449005404160/qS4bslrZ_400x400.jpg',
			context: 'profile',
			mime_type: 'image/jpeg'
		}),
		upsertResourceImage({
			resource_id: upsertPtMete.create.data.id,
			tenant_id,
			environment_id,
			public_image_url: 'https://avatars.githubusercontent.com/u/86600423',
			context: 'profile',
			mime_type: 'image/jpeg'
		})
	]);
	await runUpserts(prisma, [
		upsertResourceMarkup({
			id: makeTestId(tenant_id, environment_id, `resource_markup.ptMike.description`),
			resource_id: upsertPtMike.create.data.id,
			tenant_id,
			environment_id,
			context: 'description',
			markup_type: 'markdown'
		}),
		upsertResourceMarkupLabels({
			tenant_id,
			environment_id,
			resource_markup_id: makeTestId(tenant_id, environment_id, `resource_markup.ptMike.description`),
			language_id: en,
			markup:
				'Mike is a specialist in training people in recovery from injury.\n' +
				'\n' +
				'He has a background in sports science and has worked with a range of clients from professional athletes to those recovering from injury.\n' +
				'\n' +
				'His approach is to work with clients to help them achieve their goals and improve their quality of life.\n' +
				'\n' +
				'Mike is passionate about helping people to recover from injury and get back to doing the things they love.\n' +
				'\n' +
				'His qualifications are:\n' +
				'\n' +
				'- BSc (Hons) Sports Science\n' +
				'- Level 3 Personal Trainer\n' +
				'- Level 3 Sports Massage Therapist'
		}),
		upsertResourceMarkupLabels({
			tenant_id,
			environment_id,
			resource_markup_id: makeTestId(tenant_id, environment_id, `resource_markup.ptMike.description`),
			language_id: tr,
			markup:
				'Mike, insanların sakatlanmadan iyileşme süreci antrenmanlarında uzmandır.\n' +
				'\n' +
				'Spor bilimleri alanındaki geçmişinde, profesyonel sporculardan yaralanmadan iyileşenlere kadar çeşitli müşterilerle çalışmıştır.\n' +
				'\n' +
				'Yaklaşımı, müşterilerle çalışarak onların hedeflerine ulaşmalarına ve yaşam kalitelerini artırmalarına yardımcı olmaktır.\n' +
				'\n' +
				'Mike, insanların sakatlanmadan iyileşmelerine ve sevdikleri şeyleri yapmaya geri dönmelerine yardımcı olmak konusunda tutkuludur.\n' +
				'\n' +
				'Nitelikleri:\n' +
				'\n' +
				'- Spor Bilimleri Lisansı (Onur Derecesi)\n' +
				'- 3. Seviye Kişisel Antrenör' +
				'- 3. Seviye Spor Masaj Terapisti'
		}),
		upsertResourceMarkup({
			id: makeTestId(tenant_id, environment_id, `resource_markup.ptMete.description`),
			resource_id: upsertPtMete.create.data.id,
			tenant_id,
			environment_id,
			context: 'description',
			markup_type: 'markdown'
		}),
		upsertResourceMarkupLabels({
			tenant_id,
			environment_id,
			resource_markup_id: makeTestId(tenant_id, environment_id, `resource_markup.ptMete.description`),
			language_id: en,
			markup:
				'Mete is a specialist in elite sports training, with a particular focus on power events.\n' +
				'\n' +
				'He has worked with a number of elite athletes, including Olympic gold medalists and world champions.\n' +
				'\n' +
				'Mete has a background in exercise science and has a PhD in sports science.\n' +
				'\n' +
				'His qualifications are:\n' +
				'\n' +
				'- PhD in Sports Science\n' +
				'- MSc in Exercise Science\n' +
				'- BSc in Sports Science\n' +
				'- Certified Strength and Conditioning Specialist (CSCS)'
		}),
		upsertResourceMarkupLabels({
			tenant_id,
			environment_id,
			resource_markup_id: makeTestId(tenant_id, environment_id, `resource_markup.ptMete.description`),
			language_id: tr,
			markup:
				'Mete; elit spor eğitiminde, özellikle güç performansı konularında uzmandır.\n' +
				'\n' +
				'Olimpiyat altın madalyalıları ve dünya şampiyonları da dahil olmak üzere birçok elit sporcuyla çalışmıştır.\n' +
				'\n' +
				'Mete, egzersiz bilimleri alanında bir geçmişe ve spor bilimlerinde doktoraya sahiptir.\n' +
				'\n' +
				'Nitelikleri:\n' +
				'\n' +
				'- Spor Bilimleri Doktorası\n' +
				'- Egzersiz Bilimleri Yüksek Lisansı (Master)\n' +
				'- Spor Bilimleri Lisansı\n' +
				'- Sertifikalı Güç ve Kondisyon Uzmanı (CSCS)'
		})
	]);

	// ptMike is at harlow Mon-Fri and ware Sat-Sun
	await runUpserts(
		prisma,
		mondayToFriday.map((day) =>
			upsertResourceAvailability({
				id: makeTestId(tenant_id, environment_id, `resource_availability.ptMike.${day}.harlow`),
				tenant_id,
				environment_id,
				resource_id: upsertPtMike.create.data.id,
				location_id: locationLondon,
				day_of_week: day,
				start_time_24hr,
				end_time_24hr
			})
		)
	);
	await runUpserts(
		prisma,
		satSun.map((day) =>
			upsertResourceAvailability({
				id: makeTestId(tenant_id, environment_id, `resource_availability.ptMike.${day}.ware`),
				tenant_id,
				environment_id,
				resource_id: upsertPtMike.create.data.id,
				location_id: locationManchester,
				day_of_week: day,
				start_time_24hr,
				end_time_24hr
			})
		)
	);
	// ptMete is at harlow on Tue and Sat
	await runUpserts(prisma, [
		upsertResourceAvailability({
			id: makeTestId(tenant_id, environment_id, `resource_availability.ptMete.tue.harlow`),
			tenant_id,
			environment_id,
			resource_id: upsertPtMete.create.data.id,
			location_id: locationLondon,
			day_of_week: 'Tuesday',
			start_time_24hr,
			end_time_24hr
		}),
		upsertResourceAvailability({
			id: makeTestId(tenant_id, environment_id, `resource_availability.ptMete.sat.harlow`),
			tenant_id,
			environment_id,
			resource_id: upsertPtMete.create.data.id,
			location_id: locationLondon,
			day_of_week: 'Saturday',
			start_time_24hr,
			end_time_24hr
		})
	]);
	const massageTherapists = ['mtMete'];

	const upsertMassageTherapists = massageTherapists.map((masseur) =>
		upsertResource({
			id: makeTestId(tenant_id, environment_id, `resource.mt${masseur}`),
			tenant_id,
			environment_id,
			name: masseur,
			resource_type_id: massageTherapistResourceTypeId
		})
	);
	await runUpserts(prisma, upsertMassageTherapists);
	const mtMete = upsertMassageTherapists[0];
	// mtMete is at harlow Mon-Fri
	await runUpserts(
		prisma,
		mondayToFriday.map((day) =>
			upsertResourceAvailability({
				id: makeTestId(tenant_id, environment_id, `resource_availability.mtMete.${day}.harlow`),
				tenant_id,
				environment_id,
				resource_id: mtMete.create.data.id,
				location_id: locationLondon,
				day_of_week: day,
				start_time_24hr,
				end_time_24hr
			})
		)
	);
	// yiMike is at stortford all the time
	const yogaInstructors = ['yiMike'];
	const upsertYogaInstructors = yogaInstructors.map((yt) =>
		upsertResource({
			id: makeTestId(tenant_id, environment_id, `resource.yi${yt}`),
			tenant_id,
			environment_id,
			name: yt,
			resource_type_id: yogaInstructorResourceTypeId
		})
	);
	await runUpserts(prisma, upsertYogaInstructors);
	await runUpserts(prisma, [
		upsertTenantSettings({
			tenant_id,
			environment_id,
			customer_form_id: null
		})
	]);
	const upsertGoalsForm = upsertForm({
		id: makeTestId(tenant_id, environment_id, 'goals-form'),
		tenant_id,
		environment_id,
		name: goalsForm.name,
		description: goalsForm.description ?? goalsForm.name,
		definition: goalsForm as any
	});
	await runUpserts(prisma, [upsertGoalsForm]);
	const formLabels = [goalsFormLabelsEnglish, goalsFormLabelsTurkish];
	await runUpserts(
		prisma,
		formLabels.map((fl) =>
			upsertFormLabels({
				tenant_id,
				environment_id,
				form_id: upsertGoalsForm.create.data.id,
				language_id: fl.languageId.value,
				labels: fl as any
			})
		)
	);

	const serviceLabelUpserts = [
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: gym1Hr.create.data.id,
			language_id: en,
			name: 'Gym session (1hr)',
			description: 'Gym session (1hr)'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: gym1Hr.create.data.id,
			language_id: tr,
			name: 'Spor salonu seansı (1 saat)',
			description: 'Spor salonu seansı (1 saat)'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: pt1Hr.create.data.id,
			language_id: en,
			name: 'Personal training (1hr)',
			description: 'A personal training session with one of our trainers, 60 minutes duration'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: pt1Hr.create.data.id,
			language_id: tr,
			name: 'Kişisel antrenman (1 saat)',
			description: 'Antrenörlerimizden biriyle kişisel antrenman seansı, 60 dakika süreli'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: yoga1Hr.create.data.id,
			language_id: en,
			name: '1hr 1-to-1 Yoga',
			description: 'A 1-to-1 yoga session with one of our instructors, 60 minutes duration'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: yoga1Hr.create.data.id,
			language_id: tr,
			name: '1 saatlik birebir yoga',
			description: 'Eğitmenlerimizden biriyle birebir yoga seansı, 60 dakika süreli'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: massage30mins.create.data.id,
			language_id: en,
			name: '30 minute massage',
			description: 'A 30 minute massage session with one of our therapists'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: massage30mins.create.data.id,
			language_id: tr,
			name: '30 dakikalık masaj',
			description: 'Terapistlerimizden biriyle 30 dakikalık masaj seansı'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: swim30mins.create.data.id,
			language_id: en,
			name: '30 minute swim',
			description: 'A 30 minute swim session'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: swim30mins.create.data.id,
			language_id: tr,
			name: '30 dakikalık yüzme',
			description: '30 dakikalık yüzme seansı'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: boxing1Hr.create.data.id,
			language_id: en,
			name: '60 minute boxing session',
			description: 'A 60-minute boxing session with one of our trainers'
		}),
		upsertServiceLabel({
			tenant_id,
			environment_id,
			service_id: boxing1Hr.create.data.id,
			language_id: tr,
			name: '60 dakikalık boks seansı',
			description: 'Antrenörlerimizden biriyle 60 dakikalık boks seansı'
		})
	];
	await runUpserts(prisma, serviceUpserts);
	await runUpserts(prisma, [
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, `service_schedule_config.${gym1Hr.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: gym1Hr.create.data.id,
			schedule_config: scheduleConfig(simpleScheduleConfig(duration(minutes(60)))) as any
		}),
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, `service_schedule_config.${pt1Hr.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: pt1Hr.create.data.id,
			schedule_config: scheduleConfig(simpleScheduleConfig(duration(minutes(60)))) as any
		}),
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, `service_schedule_config.${yoga1Hr.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: yoga1Hr.create.data.id,
			schedule_config: scheduleConfig(simpleScheduleConfig(duration(minutes(60)))) as any
		}),
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, `service_schedule_config.${massage30mins.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: massage30mins.create.data.id,
			schedule_config: scheduleConfig(simpleScheduleConfig(duration(minutes(30)))) as any
		}),
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, `service_schedule_config.${swim30mins.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: swim30mins.create.data.id,
			schedule_config: scheduleConfig(simpleScheduleConfig(duration(minutes(30)))) as any
		}),
		upsertServiceScheduleConfig({
			id: makeTestId(tenant_id, environment_id, `service_schedule_config.${boxing1Hr.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: boxing1Hr.create.data.id,
			schedule_config: scheduleConfig(simpleScheduleConfig(duration(minutes(60)))) as any
		})
	]);
	await runUpserts(prisma, serviceLabelUpserts);
	await runUpserts(prisma, [
		upsertServiceResourceRequirement({
			id: makeTestId(tenant_id, environment_id, `service_resource_requirement.any_suitable.${gym1Hr.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: pt1Hr.create.data.id,
			requirement_type: 'any_suitable',
			resource_type_id: personalTrainerResourceTypeId
		}),
		upsertServiceResourceRequirement({
			id: makeTestId(tenant_id, environment_id, `service_resource_requirement.any_suitable.${yoga1Hr.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: yoga1Hr.create.data.id,
			requirement_type: 'any_suitable',
			resource_type_id: yogaInstructorResourceTypeId
		}),
		upsertServiceResourceRequirement({
			id: makeTestId(tenant_id, environment_id, `service_resource_requirement.any_suitable.${massage30mins.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: massage30mins.create.data.id,
			requirement_type: 'any_suitable',
			resource_type_id: massageTherapistResourceTypeId
		}),
		upsertServiceResourceRequirement({
			id: makeTestId(tenant_id, environment_id, `service_resource_requirement.any_suitable.${boxing1Hr.create.data.id}`),
			tenant_id,
			environment_id,
			service_id: boxing1Hr.create.data.id,
			requirement_type: 'any_suitable',
			resource_type_id: personalTrainerResourceTypeId
		})
	]);
	await runUpserts(
		prisma,
		serviceUpserts.map((su) => {
			return upsertServiceForm({
				tenant_id,
				environment_id,
				service_id: su.create.data.id,
				form_id: upsertGoalsForm.create.data.id,
				rank: 0
			});
		})
	);

	await runUpserts(prisma, [
		// All locations have a gym service
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: gym1Hr.create.data.id,
			location_id: locationLondon
		}),
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: gym1Hr.create.data.id,
			location_id: locationLiverpool
		}),
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: gym1Hr.create.data.id,
			location_id: locationManchester
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${gym1Hr.create.data.id}.${locationLondon}`),
			tenant_id,
			environment_id,
			service_id: gym1Hr.create.data.id,
			location_id: locationLondon,
			price: 1500,
			price_currency: 'GBP'
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${gym1Hr.create.data.id}.${locationLiverpool}`),
			tenant_id,
			environment_id,
			service_id: gym1Hr.create.data.id,
			location_id: locationLiverpool,
			price: 1500,
			price_currency: 'GBP'
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${gym1Hr.create.data.id}.${locationManchester}`),
			tenant_id,
			environment_id,
			service_id: gym1Hr.create.data.id,
			location_id: locationManchester,
			price: 1500,
			price_currency: 'GBP'
		}),

		// only London and Manchester have a PT service
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: pt1Hr.create.data.id,
			location_id: locationLondon
		}),
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: pt1Hr.create.data.id,
			location_id: locationManchester
		}),

		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${pt1Hr.create.data.id}.${locationLondon}`),
			tenant_id,
			environment_id,
			service_id: pt1Hr.create.data.id,
			location_id: locationLondon,
			price: 7000,
			price_currency: 'GBP'
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${pt1Hr.create.data.id}.${locationManchester}`),
			tenant_id,
			environment_id,
			service_id: pt1Hr.create.data.id,
			location_id: locationManchester,
			price: 7000,
			price_currency: 'GBP'
		}),


		// only Liverpool has a yoga service
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: yoga1Hr.create.data.id,
			location_id: locationLiverpool
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${yoga1Hr.create.data.id}.${locationLiverpool}`),
			tenant_id,
			environment_id,
			service_id: yoga1Hr.create.data.id,
			location_id: locationLiverpool,
			price: 7900,
			price_currency: 'GBP'
		}),


		// only London has a massage service
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: massage30mins.create.data.id,
			location_id: locationLondon
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${massage30mins.create.data.id}.${locationLondon}`),
			tenant_id,
			environment_id,
			service_id: massage30mins.create.data.id,
			location_id: locationLondon,
			price: 4900,
			price_currency: 'GBP'
		}),

		// only Manchester and Liverpool have a swim service
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: swim30mins.create.data.id,
			location_id: locationManchester
		}),
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: swim30mins.create.data.id,
			location_id: locationLiverpool
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${swim30mins.create.data.id}.${locationManchester}`),
			tenant_id,
			environment_id,
			service_id: swim30mins.create.data.id,
			location_id: locationManchester,
			price: 4900,
			price_currency: 'GBP'
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${swim30mins.create.data.id}.${locationLiverpool}`),
			tenant_id,
			environment_id,
			service_id: swim30mins.create.data.id,
			location_id: locationLiverpool,
			price: 4900,
			price_currency: 'GBP'
		}),

		// Add boxing service to London and Manchester locations
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: boxing1Hr.create.data.id,
			location_id: locationLondon
		}),
		upsertServiceLocation({
			tenant_id,
			environment_id,
			service_id: boxing1Hr.create.data.id,
			location_id: locationManchester
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${boxing1Hr.create.data.id}.${locationLondon}`),
			tenant_id,
			environment_id,
			service_id: boxing1Hr.create.data.id,
			location_id: locationLondon,
			price: 8000,
			price_currency: 'GBP'
		}),
		upsertServiceLocationPrice({
			id: makeTestId(tenant_id, environment_id, `service_location_price.${boxing1Hr.create.data.id}.${locationManchester}`),
			tenant_id,
			environment_id,
			service_id: boxing1Hr.create.data.id,
			location_id: locationManchester,
			price: 8000,
			price_currency: 'GBP'
		})
	]);

	const tenantBrandingId = makeTestId(tenant_id, environment_id, `tenant_branding_${tenant_id}_${environment_id}`);
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
			language_id: en,
			tenant_branding_id: tenantBrandingId,
			headline: 'Breez Gym',
			description: 'Getting fit and healthy has never been easier'
		}),
		upsertTenantBrandingLabels({
			tenant_id,
			environment_id,
			language_id: tr,
			tenant_branding_id: tenantBrandingId,
			headline: 'Breez Gym',
			description: 'Fit ve sağlıklı olmak hiç bu kadar kolay olmamıştı'
		})
	]);

	const tenBoxingSessions = createPackage(
		[serviceCredit(10, [serviceId(multiLocationGym.boxing1Hr)])],
		price(25000, currencies.GBP),
		weeks(26));

	const tenBoxingUpsert = upsertPackage({
		id: makeTestId(tenant_id, environment_id, 'package.boxing.10'),
		tenant_id,
		environment_id,
		slug: 'boxing-10',
		validity_period_type: tenBoxingSessions.validityPeriod._type,
		validity_period_value: tenBoxingSessions.validityPeriod.value,
		definition: tenBoxingSessions as any
	});

	await runUpserts(prisma, [
		tenBoxingUpsert,
		// Add the package to London and Manchester locations
		upsertPackageLocation({
			tenant_id,
			environment_id,
			package_id: tenBoxingUpsert.create.data.id,
			location_id: locationLondon
		}),
		upsertPackageLocation({
			tenant_id,
			environment_id,
			package_id: tenBoxingUpsert.create.data.id,
			location_id: locationManchester
		}),
		upsertPackageLabel({
			tenant_id,
			environment_id,
			package_id: tenBoxingUpsert.create.data.id,
			language_id: en,
			name: '10 boxing sessions',
			description: '10 boxing sessions with one of our trainers'
		}),
		upsertPackageLabel({
			tenant_id,
			environment_id,
			package_id: tenBoxingUpsert.create.data.id,
			language_id: tr,
			name: '10 boks seansı',
			description: 'Antrenörlerimizden biriyle 10 boks seansı'
		}),
		upsertPackageLocationPrice({
			id: makeTestId(tenant_id, environment_id, `package_location_price.${tenBoxingUpsert.create.data.id}.${locationLondon}`),
			tenant_id,
			environment_id,
			package_id: tenBoxingUpsert.create.data.id,
			location_id: locationLondon,
			price_amount: 25000,
			price_currency: 'GBP'
		}),
		upsertPackageLocationPrice({
			id: makeTestId(tenant_id, environment_id, `package_location_price.${tenBoxingUpsert.create.data.id}.${locationManchester}`),
			tenant_id,
			environment_id,
			package_id: tenBoxingUpsert.create.data.id,
			location_id: locationManchester,
			price_amount: 25000,
			price_currency: 'GBP'
		})
	]);
}

const goalsForm: JsonSchemaForm = {
	_type: 'json.schema.form',
	id: {
		_type: 'form.id',
		value: 'goals-form'
	},
	name: 'Goals Form',
	schema: {
		$schema: 'http://json-schema.org/draft-07/schema#',
		type: 'object',
		properties: {
			goals: {
				type: 'string'
			}
		},
		required: ['goals'],
		additionalProperties: false
	}
};

const goalsFormLabelsEnglish = jsonSchemaFormLabels(
	goalsForm.id,
	languages.en,
	'Your fitness goals',
	[schemaKeyLabel('goals', 'Goals')],
	'Let us know what you want to achieve'
);

const goalsFormLabelsTurkish = jsonSchemaFormLabels(
	goalsForm.id,
	languages.tr,
	'Fitness hedefleriniz',
	[schemaKeyLabel('goals', 'Hedefler')],
	'Neyi başarmak istediğinizi bize bildirin'
);

const eliteIsMoreExpensive: PricingRule = {
	id: makeId(environment_id, `pricing_rules`),
	name: 'Elite trainers are more expensive',
	description: 'Elite trainers are more expensive',
	requiredFactors: [pricingFactorName('resourceMetadata')],
	mutations: [
		{
			condition: jexlExpression('resourceMetadata | filter(\'metadata.tier\', \'== \\\'elite\\\' \') | length > 0'),
			mutation: add(2000),
			description: 'Elite trainers are £20 more expensive'
		}
	],
	applyAllOrFirst: 'all'
};
