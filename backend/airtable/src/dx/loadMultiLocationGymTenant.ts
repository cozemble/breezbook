import {PrismaClient} from '@prisma/client';
import {
    makeId,
    upsertBlockedTime,
    upsertBusinessHours,
    upsertForm,
    upsertFormLabels,
    upsertLocation,
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
    upsertServiceResourceRequirement,
    upsertTenant,
    upsertTenantBranding,
    upsertTenantBrandingLabels,
    upsertTenantSettings
} from "../prisma/breezPrismaMutations.js";
import {prismaMutationToPromise} from "../infra/prismaMutations.js";
import {Upsert} from "../mutation/mutations.js";
import {JsonSchemaForm, jsonSchemaFormLabels, languages, schemaKeyLabel} from "@breezbook/packages-types";
import {add, jexlCondition, PricingRule} from "@breezbook/packages-pricing";
import {makeTestId} from "./testIds.js";

const tenant_id = 'breezbook-gym';
const environment_id = 'dev';
const locationHarlow = makeTestId(tenant_id, environment_id, 'europe.uk.harlow')
const locationStortford = makeTestId(tenant_id, environment_id, 'europe.uk.bishops-stortford')
const locationWare = makeTestId(tenant_id, environment_id, 'europe.uk.ware')
const resourceTypes = ['personal.trainer', 'massage.therapist', 'yoga.instructor']

const locationUpserts = [
    upsertLocation({
        id: locationHarlow,
        tenant_id,
        environment_id,
        name: 'Harlow',
        slug: 'harlow',
    }),
    upsertLocation({
        id: locationStortford,
        tenant_id,
        environment_id,
        name: 'Bishops Stortford',
        slug: 'stortford',
    }),
    upsertLocation({
        id: locationWare,
        tenant_id,
        environment_id,
        name: 'Ware',
        slug: 'ware',
    })
]

const resourceTypeUpserts = resourceTypes.map(resourceType => upsertResourceType({
    id: makeTestId(tenant_id, environment_id, `resource_type.${resourceType}`),
    tenant_id,
    environment_id,
    name: resourceType
}))
const personalTrainerResourceTypeId = resourceTypeUpserts[0].create.data.id
const massageTherapistResourceTypeId = resourceTypeUpserts[1].create.data.id
const yogaInstructorResourceTypeId = resourceTypeUpserts[2].create.data.id

const personalTrainerUpserts = [
    upsertResource({
        id: makeTestId(tenant_id, environment_id, `resource.ptMike`),
        tenant_id,
        environment_id,
        name: "Mike",
        resource_type: personalTrainerResourceTypeId
    }),
    upsertResource({
        id: makeTestId(tenant_id, environment_id, `resource.ptMete`),
        tenant_id,
        environment_id,
        name: "Mete",
        resource_type: personalTrainerResourceTypeId,
        metadata: {
            tier: 'elite'
        }
    })
]
const upsertPtMike = personalTrainerUpserts[0]
const upsertPtMete = personalTrainerUpserts[1]

const serviceUpserts = [
    upsertService({
        id: makeTestId(tenant_id, environment_id, 'gym.service.1hr'),
        tenant_id,
        environment_id,
        slug: 'gym1hr',
        duration_minutes: 60,
        price: 1500,
        price_currency: 'GBP',
        permitted_add_on_ids: [],
        requires_time_slot: false
    }),
    upsertService({
        id: makeTestId(tenant_id, environment_id, 'pt.service.1hr'),
        tenant_id,
        environment_id,
        slug: 'pt1hr',
        duration_minutes: 60,
        price: 7000,
        price_currency: 'GBP',
        permitted_add_on_ids: [],
        requires_time_slot: false
    }),
    upsertService({
        id: makeTestId(tenant_id, environment_id, 'yoga.1to1.1hr'),
        tenant_id,
        environment_id,
        slug: 'yoga.1to1.1hr',
        duration_minutes: 60,
        price: 7900,
        price_currency: 'GBP',
        permitted_add_on_ids: [],
        requires_time_slot: false
    }),
    upsertService({
        id: makeTestId(tenant_id, environment_id, 'massage.30mins'),
        tenant_id,
        environment_id,
        slug: 'massage.30mins',
        duration_minutes: 30,
        price: 4900,
        price_currency: 'GBP',
        permitted_add_on_ids: [],
        requires_time_slot: false
    }),
    upsertService({
            id: makeTestId(tenant_id, environment_id, 'swim.30mins'),
            tenant_id,
            environment_id,
            slug: 'swim.30mins',
            duration_minutes: 30,
            price: 4900,
            price_currency: 'GBP',
            permitted_add_on_ids: [],
            requires_time_slot: false
        }
    ),
]

const [gym1Hr, pt1Hr, yoga1Hr, massage30mins, swim30mins] = serviceUpserts


export const multiLocationGym = {
    tenant_id,
    environment_id,
    locationHarlow,
    locationStortford,
    locationWare,
    gym1Hr: gym1Hr.create.data.id,
    pt1Hr: pt1Hr.create.data.id,
    yoga1Hr: yoga1Hr.create.data.id,
    massage30mins: massage30mins.create.data.id,
    swim30mins: swim30mins.create.data.id,
    ptMike: upsertPtMike.create.data.id,
    ptMete: upsertPtMete.create.data.id
}

export async function runUpserts(prisma: PrismaClient, upserts: Upsert[]): Promise<Upsert[]> {
    for (const upsert of upserts) {
        await prismaMutationToPromise(prisma, upsert)
    }
    return upserts
}

export async function loadMultiLocationGymTenant(prisma: PrismaClient): Promise<void> {
    const en = languages.en.value
    const tr = languages.tr.value

    await runUpserts(prisma, [upsertTenant({
        tenant_id,
        name: 'Multi-location Gym',
        slug: tenant_id
    })])
    await runUpserts(prisma, locationUpserts)

    const mondayToFriday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const satSun = ['Saturday', 'Sunday']
    const daysOfWeek = [...mondayToFriday, ...satSun]
    const start_time_24hr = '09:00';
    const end_time_24hr = '18:00';
    const businessHourUpserts = daysOfWeek.map(day => upsertBusinessHours({
        id: makeTestId(tenant_id, environment_id, `business_hours.${day}`),
        tenant_id,
        environment_id,
        day_of_week: day,
        start_time_24hr,
        end_time_24hr
    }))
    // Let's make harlow closed on Wednesdays
    const daysLessWednesday = daysOfWeek.filter(day => day !== 'Wednesday')
    const harlowBusinessHourUpserts = daysLessWednesday.map(day => upsertBusinessHours({
        id: makeTestId(tenant_id, environment_id, `business_hours.${day}.harlow`),
        tenant_id,
        environment_id,
        day_of_week: day,
        start_time_24hr,
        end_time_24hr,
        location_id: locationHarlow

    }))
    await runUpserts(prisma, [...businessHourUpserts, ...harlowBusinessHourUpserts]);

    // everywhere is closed on Christmas day, and Harlow on the 26th in addition
    const blockedTimeUpserts = [
        upsertBlockedTime({
            id: makeTestId(tenant_id, environment_id, `blocked_time.christmas.1`),
            tenant_id,
            environment_id,
            location_id: locationHarlow,
            date: '2024-12-25',
            start_time_24hr,
            end_time_24hr
        }),
        upsertBlockedTime({
            id: makeTestId(tenant_id, environment_id, `blocked_time.christmas.2`),
            tenant_id,
            environment_id,
            location_id: locationHarlow,
            date: '2024-12-26',
            start_time_24hr,
            end_time_24hr
        }),
        upsertBlockedTime({
            id: makeTestId(tenant_id, environment_id, `blocked_time.christmas.3`),
            tenant_id,
            environment_id,
            location_id: locationStortford,
            date: '2024-12-25',
            start_time_24hr,
            end_time_24hr
        }),
        upsertBlockedTime({
                id: makeTestId(tenant_id, environment_id, `blocked_time.christmas.4`),
                tenant_id,
                environment_id,
                location_id: locationWare,
                date: '2024-12-25',
                start_time_24hr,
                end_time_24hr
            }
        ),
    ]
    await runUpserts(prisma, blockedTimeUpserts);

    await runUpserts(prisma, resourceTypeUpserts)

    await runUpserts(prisma, personalTrainerUpserts)
    await runUpserts(prisma, [
        upsertPricingRule({
            id: makeTestId(tenant_id, environment_id, `pricing_rule.eliteIsMoreExpensive`),
            tenant_id,
            environment_id,
            rank: 0,
            active: true,
            definition: eliteIsMoreExpensive as any
        })
    ])
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
    ])
    await runUpserts(prisma, [
        upsertResourceMarkup({
            id: makeTestId(tenant_id, environment_id, `resource_markup.ptMike.description`),
            resource_id: upsertPtMike.create.data.id,
            tenant_id,
            environment_id,
            context: 'description',
            markup_type: 'markdown',
        }),
        upsertResourceMarkupLabels({
            tenant_id,
            environment_id,
            resource_markup_id: makeTestId(tenant_id, environment_id, `resource_markup.ptMike.description`),
            language_id: en,
            markup: 'Mike is a specialist in training people in recovery from injury.\n' +
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
            markup: 'Mike, yaralanmadan iyileşme sürecinde insanları eğitme konusunda uzmandır.\n' +
                '\n' +
                'Spor bilimleri alanında bir geçmişi var ve profesyonel sporculardan yaralanmadan iyileşenlere kadar çeşitli müşterilerle çalışmıştır.\n' +
                '\n' +
                'Yaklaşımı, müşterilerle çalışarak onların hedeflerine ulaşmalarına ve yaşam kalitelerini artırmalarına yardımcı olmaktır.\n' +
                '\n' +
                'Mike, insanların yaralanmadan iyileşmelerine ve sevdikleri şeyleri yapmaya geri dönmelerine yardımcı olmaktan tutkulu.\n' +
                '\n' +
                'Onun nitelikleri şunlardır:\n' +
                '\n' +
                '- Lisans (Onur) Spor Bilimleri\n' +
                '- Seviye 3 Kişisel Antrenör\n' +
                '- Seviye 3 Spor Masaj Terapisti'
        }),
        upsertResourceMarkup({
                id: makeTestId(tenant_id, environment_id, `resource_markup.ptMete.description`),
                resource_id: upsertPtMete.create.data.id,
                tenant_id,
                environment_id,
                context: 'description',
                markup_type: 'markdown',
            }
        ),
        upsertResourceMarkupLabels({
            tenant_id,
            environment_id,
            resource_markup_id: makeTestId(tenant_id, environment_id, `resource_markup.ptMete.description`),
            language_id: en,
            markup: 'Mete is a specialist in elite sports training, with a particular focus on power events.\n' +
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
            markup: 'Mete, özellikle güç etkinliklerine odaklanarak elit spor eğitiminde uzmandır.\n' +
                '\n' +
                'Olimpiyat altın madalyalıları ve dünya şampiyonları da dahil olmak üzere birçok elit sporcuyla çalışmıştır.\n' +
                '\n' +
                'Mete, egzersiz bilimleri alanında bir geçmişi var ve spor bilimlerinde doktora yapmıştır.\n' +
                '\n' +
                'Onun nitelikleri şunlardır:\n' +
                '\n' +
                '- Spor Bilimlerinde Doktora\n' +
                '- Egzersiz Bilimlerinde Yüksek Lisans\n' +
                '- Spor Bilimlerinde Lisans\n' +
                '- Sertifikalı Güç ve Kondisyon Uzmanı (CSCS)'
        })
    ]);

    // ptMike is at harlow Mon-Fri and ware Sat-Sun
    await runUpserts(prisma, mondayToFriday.map(day =>
        upsertResourceAvailability({
            id: makeTestId(tenant_id, environment_id, `resource_availability.ptMike.${day}.harlow`),
            tenant_id,
            environment_id,
            resource_id: upsertPtMike.create.data.id,
            location_id: locationHarlow,
            day_of_week: day,
            start_time_24hr,
            end_time_24hr
        })));
    await runUpserts(prisma, satSun.map(day =>
        upsertResourceAvailability({
            id: makeTestId(tenant_id, environment_id, `resource_availability.ptMike.${day}.ware`),
            tenant_id,
            environment_id,
            resource_id: upsertPtMike.create.data.id,
            location_id: locationWare,
            day_of_week: day,
            start_time_24hr,
            end_time_24hr
        })))
    // ptMete is at harlow on Tue and Sat
    await runUpserts(prisma, [
        upsertResourceAvailability({
            id: makeTestId(tenant_id, environment_id, `resource_availability.ptMete.tue.harlow`),
            tenant_id,
            environment_id,
            resource_id: upsertPtMete.create.data.id,
            location_id: locationHarlow,
            day_of_week: 'Tuesday',
            start_time_24hr,
            end_time_24hr
        }), upsertResourceAvailability({
            id: makeTestId(tenant_id, environment_id, `resource_availability.ptMete.sat.harlow`),
            tenant_id,
            environment_id,
            resource_id: upsertPtMete.create.data.id,
            location_id: locationHarlow,
            day_of_week: 'Saturday',
            start_time_24hr,
            end_time_24hr
        })])
    const massageTherapists = ['mtMete']

    const upsertMassageTherapists = massageTherapists.map(masseur => upsertResource({
        id: makeTestId(tenant_id, environment_id, `resource.mt${masseur}`),
        tenant_id,
        environment_id,
        name: masseur,
        resource_type: massageTherapistResourceTypeId
    }))
    await runUpserts(prisma, upsertMassageTherapists);
    const mtMete = upsertMassageTherapists[0]
    // mtMete is at harlow Mon-Fri
    await runUpserts(prisma, mondayToFriday.map(day => (upsertResourceAvailability({
            id: makeTestId(tenant_id, environment_id, `resource_availability.mtMete.${day}.harlow`),
            tenant_id,
            environment_id,
            resource_id: mtMete.create.data.id,
            location_id: locationHarlow,
            day_of_week: day,
            start_time_24hr,
            end_time_24hr
        })))
    )
    // yiMike is at stortford all the time
    const yogaInstructors = ['yiMike']
    const upsertYogaInstructors = yogaInstructors.map(yt => upsertResource({
        id: makeTestId(tenant_id, environment_id, `resource.yi${yt}`),
        tenant_id,
        environment_id,
        name: yt,
        resource_type: yogaInstructorResourceTypeId
    }))
    await runUpserts(prisma, upsertYogaInstructors)
    await runUpserts(prisma, [
        upsertTenantSettings({
                tenant_id,
                environment_id,
                customer_form_id: null,
                iana_timezone: 'Europe/London'
            }
        )])
    const upsertGoalsForm = upsertForm({
        id: makeTestId(tenant_id, environment_id, 'goals-form'),
        tenant_id,
        environment_id,
        name: goalsForm.name,
        description: goalsForm.description ?? goalsForm.name,
        definition: goalsForm as any
    })
    await runUpserts(prisma, [upsertGoalsForm])
    const formLabels = [goalsFormLabelsEnglish, goalsFormLabelsTurkish]
    await runUpserts(prisma, formLabels.map(fl => upsertFormLabels({
        tenant_id,
        environment_id,
        form_id: upsertGoalsForm.create.data.id,
        language_id: fl.languageId.value,
        labels: fl as any
    })))

    const [gym1Hr, pt1Hr, yoga1Hr, massage30mins, swim30mins] = serviceUpserts
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
        })
    ]
    await runUpserts(prisma, serviceUpserts);
    await runUpserts(prisma, serviceLabelUpserts);
    await runUpserts(prisma, [
        upsertServiceResourceRequirement({
            id: makeTestId(tenant_id, environment_id, `service_resource_requirement.any_suitable.${gym1Hr.create.data.id}`),
            tenant_id,
            environment_id,
            service_id: pt1Hr.create.data.id,
            requirement_type: 'any_suitable',
            resource_type: personalTrainerResourceTypeId
        }),
        upsertServiceResourceRequirement({
            id: makeTestId(tenant_id, environment_id, `service_resource_requirement.any_suitable.${yoga1Hr.create.data.id}`),
            tenant_id,
            environment_id,
            service_id: yoga1Hr.create.data.id,
            requirement_type: 'any_suitable',
            resource_type: yogaInstructorResourceTypeId
        }),
        upsertServiceResourceRequirement({
            id: makeTestId(tenant_id, environment_id, `service_resource_requirement.any_suitable.${massage30mins.create.data.id}`),
            tenant_id,
            environment_id,
            service_id: massage30mins.create.data.id,
            requirement_type: 'any_suitable',
            resource_type: massageTherapistResourceTypeId
        }),
    ])
    await runUpserts(prisma, serviceUpserts.map(su => {
        return upsertServiceForm({
            tenant_id,
            environment_id,
            service_id: su.create.data.id,
            form_id: upsertGoalsForm.create.data.id,
            rank: 0
        });
    }))

    await runUpserts(prisma, [
        // All locations have a gym service
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: gym1Hr.create.data.id,
            location_id: locationHarlow
        }),
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: gym1Hr.create.data.id,
            location_id: locationStortford
        }),
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: gym1Hr.create.data.id,
            location_id: locationWare,
        }),
        // only Harlow and Ware have a PT service
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: pt1Hr.create.data.id,
            location_id: locationHarlow
        }),
        upsertServiceLocation({tenant_id, environment_id, service_id: pt1Hr.create.data.id, location_id: locationWare}),
        // only Bishops Stortford has a yoga service
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: yoga1Hr.create.data.id,
            location_id: locationStortford
        }),
        // only Harlow has a massage service
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: massage30mins.create.data.id,
            location_id: locationHarlow
        }),
        // only Ware and Stortford have a swim service
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: swim30mins.create.data.id,
            location_id: locationWare
        }),
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: swim30mins.create.data.id,
            location_id: locationStortford
        })
    ])

    const tenantBrandingId = makeTestId(tenant_id, environment_id, `tenant_branding_${tenant_id}_${environment_id}`)
    await runUpserts(prisma, [
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
            language_id: en,
            tenant_branding_id: tenantBrandingId,
            headline: 'Breez Gym',
            description: 'Getting fit and healthy has never been easier',
        }),
        upsertTenantBrandingLabels({
            tenant_id,
            environment_id,
            language_id: tr,
            tenant_branding_id: tenantBrandingId,
            headline: 'Breez Gym',
            description: 'Fit ve sağlıklı olmak hiç bu kadar kolay olmamıştı',
        })
    ])
}

const goalsForm: JsonSchemaForm = {
    "_type": "json.schema.form",
    "id": {
        "_type": "form.id",
        "value": "goals-form"
    },
    "name": "Goals Form",
    "schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "goals": {
                "type": "string"
            },
        },
        "required": [
            "goals",
        ],
        "additionalProperties": false
    }
};

const goalsFormLabelsEnglish = jsonSchemaFormLabels(goalsForm.id, languages.en, "Your goals",
    [schemaKeyLabel("goals", "Goals")],
    "What are your fitness goals")

const goalsFormLabelsTurkish = jsonSchemaFormLabels(goalsForm.id, languages.tr, "Hedefleriniz", [
    schemaKeyLabel("goals", "Hedefler")
], "Spor hedefleriniz nelerdir")


const eliteIsMoreExpensive: PricingRule = {
    id: makeId(environment_id, `pricing_rules`),
    name: 'Elite trainers are more expensive',
    description: 'Elite trainers are more expensive',
    requiredFactors: ['resourceMetadata'],
    mutations: [
        {
            condition: jexlCondition("resourceMetadata | filter('metadata.tier', '== \\'elite\\' ') | length > 0"),
            mutation: add(2000),
            description: 'Elite trainers are £20 more expensive'
        }
    ],
    applyAllOrFirst: 'all'
}

