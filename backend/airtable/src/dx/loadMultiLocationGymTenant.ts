import {PrismaClient} from '@prisma/client';
import {makeTestId} from "./testIds.js";
import {
    upsertBlockedTime,
    upsertBusinessHours,
    upsertResource,
    upsertResourceType
} from "../prisma/breezPrismaMutations.js";
import {prismaMutationToPromise} from "../infra/prismaMutations.js";
import {Upsert} from "../mutation/mutations.js";

const tenant_id = 'breezbook-gym';
const environment_id = 'dev';
const locationHarlow = makeTestId(tenant_id, environment_id, 'europe.uk.harlow')
const locationStortford = makeTestId(tenant_id, environment_id, 'europe.uk.bishops-stortford')
const locationWare = makeTestId(tenant_id, environment_id, 'europe.uk.ware')
const gym1Hr = makeTestId(tenant_id, environment_id, 'gym.service.1hr');
const pt1Hr = makeTestId(tenant_id, environment_id, 'pt.service.1hr');
const yoga1Hr = makeTestId(tenant_id, environment_id, 'yoga.1to1.1hr');
const massage30mins = makeTestId(tenant_id, environment_id, 'massage.30mins');
const swim30mins = makeTestId(tenant_id, environment_id, 'swim.30mins');
const ptMike = makeTestId(tenant_id, environment_id, `resource.ptMike`)
const ptMete = makeTestId(tenant_id, environment_id, `resource.ptMete`)
const resourceTypes = ['personal.trainer', 'massage.therapist', 'yoga.instructor']


export const multiLocationGym = {
    tenant_id,
    environment_id,
    locationHarlow,
    locationStortford,
    locationWare,
    gym1Hr,
    pt1Hr,
    yoga1Hr,
    massage30mins,
    swim30mins,
    ptMike,
    ptMete
}

async function runUpserts(prisma: PrismaClient, upserts: Upsert<any, any, any>[]) {
    for (const upsert of upserts) {
        await prismaMutationToPromise(prisma, upsert)
    }
}

export async function loadMultiLocationGymTenant(prisma: PrismaClient): Promise<void> {
    await prisma.tenants.upsert({
        where: {
            tenant_id
        },
        create: {
            tenant_id,
            name: 'Multi-location Gym',
            slug: tenant_id
        },
        update: {
            name: 'Multi-location Gym',
            slug: tenant_id
        }
    })
    await prisma.locations.upsert({
        where: {
            id: locationHarlow,
        },
        create: {
            id: locationHarlow,
            tenant_id,
            environment_id,
            name: 'Harlow',
            slug: 'harlow',
        },
        update: {
            tenant_id,
            environment_id,
            name: 'Harlow',
            slug: 'harlow',
        }
    });
    await prisma.locations.upsert({
        where: {
            id: locationStortford,
        },
        create: {
            id: locationStortford,
            tenant_id,
            environment_id,
            name: 'Bishops Stortford',
            slug: 'stortford',
        },
        update: {
            tenant_id,
            environment_id,
            name: 'Bishops Stortford',
            slug: 'stortford',
        }
    });
    await prisma.locations.upsert({
        where: {
            id: locationWare
        },
        create: {
            id: locationWare,
            tenant_id,
            environment_id,
            name: 'Ware',
            slug: 'ware',
        },
        update: {
            tenant_id,
            environment_id,
            name: 'Ware',
            slug: 'ware',
        }
    });
    const mondayToFriday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const satSun = ['Saturday', 'Sunday']
    const daysOfWeek = [...mondayToFriday, ...satSun]
    const start_time_24hr = '09:00';
    const end_time_24hr = '18:00';
    const businessHourUpserts = daysOfWeek.map((day, index) => upsertBusinessHours({
        id: makeTestId(tenant_id, environment_id, `businessHours#${index + 1}`),
        tenant_id,
        environment_id,
        day_of_week: day,
        start_time_24hr,
        end_time_24hr

    }))
    // Let's make harlow closed on Wednesdays
    const daysLessWednesday = daysOfWeek.filter(day => day !== 'Wednesday')
    const harlowBusinessHourUpserts = daysLessWednesday.map((day, index) => upsertBusinessHours({
        id: makeTestId(tenant_id, environment_id, `harlowBusinessHours#${index + 1}`),
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
            id: makeTestId(tenant_id, environment_id, `blockedChristmasDay.harlow`),
            tenant_id,
            environment_id,
            location_id: locationHarlow,
            date: '2024-12-25',
            start_time_24hr,
            end_time_24hr
        }),
        upsertBlockedTime({
            id: makeTestId(tenant_id, environment_id, `blockedBoxingDay.harlow`),
            tenant_id,
            environment_id,
            location_id: locationHarlow,
            date: '2024-12-26',
            start_time_24hr,
            end_time_24hr
        }),
        upsertBlockedTime({
            id: makeTestId(tenant_id, environment_id, `blockedChristmasDay.stortford`),
            tenant_id,
            environment_id,
            location_id: locationStortford,
            date: '2024-12-25',
            start_time_24hr,
            end_time_24hr
        }),
        upsertBlockedTime({
                id: makeTestId(tenant_id, environment_id, `blockedChristmasDay.ware`),
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

    const resourceTypeUpserts = resourceTypes.map(resourceType => upsertResourceType({
        id: makeTestId(tenant_id, environment_id, `resource.${resourceType}`),
        tenant_id,
        environment_id,
        name: resourceType
    }))
    await runUpserts(prisma, resourceTypeUpserts)

    const personalTrainers = ['ptMike', 'ptMete']
    await runUpserts(prisma, personalTrainers.map(pt => upsertResource({
        id: makeTestId(tenant_id, environment_id, `resource.${pt}`),
        tenant_id,
        environment_id,
        name: pt,
        resource_type: makeTestId(tenant_id, environment_id, `resource.personal.trainer`)
    })))
    await prisma.resource_images.createMany({
        data: [
            {
                resource_id: makeTestId(tenant_id, environment_id, `resource.ptMike`),
                tenant_id,
                environment_id,
                public_image_url: 'https://pbs.twimg.com/profile_images/1783563449005404160/qS4bslrZ_400x400.jpg',
                context: 'profile',
                mime_type: 'image/jpeg'
            }, {
                resource_id: makeTestId(tenant_id, environment_id, `resource.ptMete`),
                tenant_id,
                environment_id,
                public_image_url: 'https://avatars.githubusercontent.com/u/86600423',
                context: 'profile',
                mime_type: 'image/jpeg'
            }]
    });
    await prisma.resource_markup.createMany({
        data: [
            {
                resource_id: makeTestId(tenant_id, environment_id, `resource.ptMike`),
                tenant_id,
                environment_id,
                context: 'description',
                markup_type: 'markdown',
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
            },
            {
                resource_id: makeTestId(tenant_id, environment_id, `resource.ptMete`),
                tenant_id,
                environment_id,
                context: 'description',
                markup_type: 'markdown',
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
            }
        ]
    });

    // ptMike is at harlow Mon-Fri and ware Sat-Sun
    await prisma.resource_availability.createMany({
        data: mondayToFriday.map((day, dayIndex) => ({
            id: makeTestId(tenant_id, environment_id, `ptMikeAvailability.harlow#${dayIndex + 1}`),
            tenant_id,
            environment_id,
            resource_id: ptMike,
            location_id: locationHarlow,
            day_of_week: day,
            start_time_24hr,
            end_time_24hr
        }))
    });
    await prisma.resource_availability.createMany({
        data: satSun.map((day, dayIndex) => ({
            id: makeTestId(tenant_id, environment_id, `ptMikeAvailability.ware#${dayIndex + 1}`),
            tenant_id,
            environment_id,
            resource_id: ptMike,
            location_id: locationWare,
            day_of_week: day,
            start_time_24hr,
            end_time_24hr
        }))
    });
    // ptMete is at harlow on Tue
    await prisma.resource_availability.createMany({
        data: [{
            id: makeTestId(tenant_id, environment_id, `ptMeteAvailability.harlow#1`),
            tenant_id,
            environment_id,
            resource_id: ptMete,
            location_id: locationHarlow,
            day_of_week: 'Tuesday',
            start_time_24hr,
            end_time_24hr
        }]
    });
    const massageTherapists = ['mtMete']
    await prisma.resources.createMany({
        data: massageTherapists.map((masseur, index) => ({
            id: makeTestId(tenant_id, environment_id, `masseur#${index + 1}`),
            tenant_id,
            environment_id,
            name: masseur,
            resource_type: makeTestId(tenant_id, environment_id, `resource.massage.therapist`)
        }))
    });
    // mtMete is at harlow Mon-Fri
    await prisma.resource_availability.createMany({
        data: mondayToFriday.map((day, dayIndex) => ({
            id: makeTestId(tenant_id, environment_id, `mtMeteAvailability.harlow#${dayIndex + 1}`),
            tenant_id,
            environment_id,
            resource_id: makeTestId(tenant_id, environment_id, `masseur#1`),
            location_id: locationHarlow,
            day_of_week: day,
            start_time_24hr,
            end_time_24hr
        }))
    });
    // yiMike is at stortford all the time
    const yogaInstructors = ['yiMike']
    await prisma.resources.createMany({
        data: yogaInstructors.map((yt, index) => ({
            id: makeTestId(tenant_id, environment_id, `yi#${index + 1}`),
            tenant_id,
            environment_id,
            name: yt,
            resource_type: makeTestId(tenant_id, environment_id, `resource.yoga.instructor`)
        }))
    });
    await prisma.tenant_settings.create({
        data: {
            tenant_id,
            environment_id,
            customer_form_id: null,
            iana_timezone: 'Europe/London'
        }
    });
    await prisma.services.createMany({
        data: [
            {
                id: gym1Hr,
                tenant_id,
                environment_id,
                slug: 'gym1hr',
                name: 'Gym session (1hr)',
                description: 'Gym session (1hr)',
                duration_minutes: 60,
                price: 1500,
                price_currency: 'GBP',
                permitted_add_on_ids: [],
                resource_types_required: [],
                requires_time_slot: false
            },
            {
                id: pt1Hr,
                tenant_id,
                environment_id,
                slug: 'pt1hr',
                name: 'Personal training (1hr)',
                description: 'A personal training session with one of our trainers, 60 minutes duration',
                duration_minutes: 60,
                price: 7000,
                price_currency: 'GBP',
                permitted_add_on_ids: [],
                resource_types_required: [makeTestId(tenant_id, environment_id, `resource.personal.trainer`)],
                requires_time_slot: false
            },
            {
                id: yoga1Hr,
                tenant_id,
                environment_id,
                slug: 'yoga.1to1.1hr',
                name: '1hr 1-to-1 Yoga',
                description: 'A 1-to-1 yoga session with one of our instructors, 60 minutes duration',
                duration_minutes: 60,
                price: 7900,
                price_currency: 'GBP',
                permitted_add_on_ids: [],
                resource_types_required: [makeTestId(tenant_id, environment_id, `resource.yoga.instructor`)],
                requires_time_slot: false
            },
            {
                id: massage30mins,
                tenant_id,
                environment_id,
                slug: 'massage.30mins',
                name: '30 minute massage',
                description: 'A 30 minute massage session with one of our therapists',
                duration_minutes: 30,
                price: 4900,
                price_currency: 'GBP',
                permitted_add_on_ids: [],
                resource_types_required: [makeTestId(tenant_id, environment_id, `resource.massage.therapist`)],
                requires_time_slot: false
            },
            {
                id: swim30mins,
                tenant_id,
                environment_id,
                slug: 'swim.30mins',
                name: '30 minute swim',
                description: 'A 30 minute swim session',
                duration_minutes: 30,
                price: 4900,
                price_currency: 'GBP',
                permitted_add_on_ids: [],
                resource_types_required: [],
                requires_time_slot: false
            }
        ]
    });

    await prisma.service_locations.createMany({
        data: [
            // All locations have a gym service
            {
                tenant_id, environment_id, service_id: gym1Hr, location_id: locationHarlow
            },
            {
                tenant_id, environment_id, service_id: gym1Hr, location_id: locationStortford
            },
            {
                tenant_id, environment_id, service_id: gym1Hr, location_id: locationWare,
            },
            // only Harlow and Ware have a PT service
            {
                tenant_id, environment_id, service_id: pt1Hr, location_id: locationHarlow
            },
            {
                tenant_id, environment_id, service_id: pt1Hr, location_id: locationWare
            },
            // only Bishops Stortford has a yoga service
            {
                tenant_id, environment_id, service_id: yoga1Hr, location_id: locationStortford
            },
            // only Harlow has a massage service
            {
                tenant_id, environment_id, service_id: massage30mins, location_id: locationHarlow
            },
            // only Ware and Stortford have a swim service
            {
                tenant_id, environment_id, service_id: swim30mins, location_id: locationWare
            },
            {
                tenant_id, environment_id, service_id: swim30mins, location_id: locationStortford
            }
        ]
    });

    await prisma.tenant_branding.create({
        data: {
            tenant_id,
            environment_id,
            headline: 'Breez Gym',
            description: 'Getting fit and healthy has never been easier',
            theme: {}
        }
    });

}


