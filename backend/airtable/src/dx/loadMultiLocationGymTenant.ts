import {PrismaClient} from '@prisma/client';
import {makeTestId} from "./testIds.js";

function allDayAvailability(tenant_id: string, environment_id: string, index: number, dayIndex: number, day: string, resourceAbbreviation: string) {
    return {
        id: makeTestId(tenant_id, environment_id, `${resourceAbbreviation}Availability#${index + 1}#${dayIndex + 1}`),
        tenant_id,
        environment_id,
        resource_id: makeTestId(tenant_id, environment_id, `${resourceAbbreviation}#${index + 1}`),
        day_of_week: day,
        start_time_24hr: '09:00',
        end_time_24hr: '18:00'
    };
}

const tenant_id = 'breezbook.multi.location.gym';
const environment_id = 'dev';
const locationHarlow = makeTestId(tenant_id, environment_id, 'europe.uk.harlow')
const locationStortford = makeTestId(tenant_id, environment_id, 'europe.uk.bishops-stortford')
const locationWare = makeTestId(tenant_id, environment_id, 'europe.uk.ware')
const gym1Hr = makeTestId(tenant_id, environment_id, 'gym.service.1hr');
const pt1Hr = makeTestId(tenant_id, environment_id, 'pt.service.1hr');
const yoga1Hr = makeTestId(tenant_id, environment_id, 'yoga.1to1.1hr');
const massage30mins = makeTestId(tenant_id, environment_id, 'massage.30mins');
const swim30mins = makeTestId(tenant_id, environment_id, 'swim.30mins');

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
    swim30mins
}

export async function loadMultiLocationGymTenant(prisma: PrismaClient): Promise<void> {
    await prisma.tenants.create({
        data: {
            tenant_id,
            name: 'Multi-location Gym',
            slug: tenant_id
        }
    })
    await prisma.locations.create({
        data: {
            id: locationHarlow,
            tenant_id,
            environment_id,
            name: 'Harlow',
            slug: 'harlow',
        }
    });
    await prisma.locations.create({
        data: {
            id: locationStortford,
            tenant_id,
            environment_id,
            name: 'Bishops Stortford',
            slug: 'stortford',
        }
    });
    await prisma.locations.create({
        data: {
            id: locationWare,
            tenant_id,
            environment_id,
            name: 'Ware',
            slug: 'ware',
        }
    });
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    await prisma.business_hours.createMany({
        data: daysOfWeek.map((day, index) => ({
            id: makeTestId(tenant_id, environment_id, `businessHours#${index + 1}`),
            tenant_id,
            environment_id,
            day_of_week: day,
            start_time_24hr: '09:00',
            end_time_24hr: '18:00'

        }))
    });
    const resourceTypes = ['personal.trainer', 'massage.therapist', 'yoga.instructor']
    await prisma.resource_types.createMany({
        data: resourceTypes.map((resourceType) => ({
            id: makeTestId(tenant_id, environment_id, `resource.${resourceType}`),
            tenant_id,
            environment_id,
            name: resourceType

        }))
    });
    const personalTrainers = ['ptMike', 'ptMete']
    await prisma.resources.createMany({
        data: personalTrainers.map((pt, index) => ({
            id: makeTestId(tenant_id, environment_id, `pt#${index + 1}`),
            tenant_id,
            environment_id,
            name: pt,
            resource_type: makeTestId(tenant_id, environment_id, `resource.personal.trainer`)
        }))
    });
    const massageTherapists = ['mtMike', 'mtMete']
    await prisma.resources.createMany({
        data: massageTherapists.map((masseur, index) => ({
            id: makeTestId(tenant_id, environment_id, `masseur#${index + 1}`),
            tenant_id,
            environment_id,
            name: masseur,
            resource_type: makeTestId(tenant_id, environment_id, `massage.therapist`)
        }))
    });
    const yogaInstructors = ['yiMike']
    await prisma.resources.createMany({
        data: yogaInstructors.map((yt, index) => ({
            id: makeTestId(tenant_id, environment_id, `yt#${index + 1}`),
            tenant_id,
            environment_id,
            name: yt,
            resource_type: makeTestId(tenant_id, environment_id, `yoga.instructor`)
        }))
    });
    await prisma.resource_availability.createMany({
        data: [
            ...personalTrainers.flatMap((_staff, index) => daysOfWeek.map((day, dayIndex) => allDayAvailability(tenant_id, environment_id, index, dayIndex, day, 'pt'))),
            ...massageTherapists.flatMap((_staff, index) => daysOfWeek.map((day, dayIndex) => allDayAvailability(tenant_id, environment_id, index, dayIndex, day, 'mt'))),
            ...yogaInstructors.flatMap((_staff, index) => daysOfWeek.map((day, dayIndex) => allDayAvailability(tenant_id, environment_id, index, dayIndex, day, 'yi')))
        ]
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

}


