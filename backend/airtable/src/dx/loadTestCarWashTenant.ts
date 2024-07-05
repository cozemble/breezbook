import {PrismaClient} from '@prisma/client';
import {carwash, currencies, price, Price} from "@breezbook/packages-core";
import {
    addOnId,
    AddOnId,
    environmentId,
    JsonSchemaForm,
    locationId,
    serviceId,
    ServiceId,
    TenantEnvironment,
    tenantId
} from "@breezbook/packages-types";
import {maybeGetTenantSecret, storeTenantSecret} from "../infra/secretsInPostgres.js";
import {STRIPE_API_KEY_SECRET_NAME, STRIPE_PUBLIC_KEY_SECRET_NAME} from "../express/stripeEndpoint.js";
import {runUpserts} from "./loadMultiLocationGymTenant.js";
import {
    upsertAddOn,
    upsertBusinessHours,
    upsertCoupon,
    upsertForm,
    upsertLocation,
    upsertPricingRule,
    upsertResource,
    upsertResourceAvailability,
    upsertResourceType,
    upsertService,
    upsertServiceForm,
    upsertServiceImage,
    upsertServiceLabel,
    upsertServiceLocation,
    upsertServiceResourceRequirement,
    upsertTenant,
    upsertTenantBranding,
    upsertTenantImage,
    upsertTenantSettings,
    upsertTimeslot
} from "../prisma/breezPrismaMutations.js";
import {toNumber} from "../prisma/prismaNumbers.js";
import {makeTestId} from "./testIds.js";

const tenant_id = 'tenant1';
const environment_id = 'dev';

const locationUpserts = [
    upsertLocation({
            id: makeTestId(tenant_id, environment_id, 'london'),
            tenant_id,
            environment_id,
            name: 'London',
            slug: 'london',
        }
    ),
    upsertLocation({
        id: makeTestId(tenant_id, environment_id, 'liverpool'),
            tenant_id,
            environment_id,
            name: 'Liverpool',
            slug: 'liverpool',
        }
    )
]
const [londonUpsert, liverpoolUpsert] = locationUpserts;

const addOns = carwash.addOns;
const addOnUpserts = addOns.map((addOn) => upsertAddOn({
    id: makeTestId(tenant_id, environment_id, addOn.id.value),
    tenant_id,
    environment_id,
    name: addOn.name,
    price: addOn.price.amount.value,
    price_currency: addOn.price.currency.value,
    expect_quantity: addOn.requiresQuantity,
    description: addOn.description
}))
const addOnIds = addOnUpserts.map(u => u.create.data.id)
const [wax, polish, cleanSeats, cleanCarpets] = addOnUpserts;

const serviceUpserts = carwash.services.map((service) => {
    const slug = service.id.value.replace('/.id/', '');
    return upsertService({
        id: makeTestId(tenant_id, environment_id, slug),
        tenant_id,
        environment_id,
        slug,
        duration_minutes: service.duration.value,
        price: service.price.amount.value,
        price_currency: service.price.currency.value,
        permitted_add_on_ids: addOnIds,
        requires_time_slot: true
    });
})

const [smallCarWashUpsert, mediumCarWashUpsert, largeCarWashUpsert] = serviceUpserts;

interface ServiceEssential {
    id: ServiceId
    price: Price
}

interface AddOnEssential {
    id: AddOnId
    price: Price
}

export const dbCarwashTenant = {
    tenantId: tenantId(tenant_id),
    environmentId: environmentId(environment_id),
    locations: {
        london: locationId(londonUpsert.create.data.id),
        liverpool: locationId(liverpoolUpsert.create.data.id)
    },
    smallCarWash: {
        id: serviceId(smallCarWashUpsert.create.data.id),
        price: price(toNumber(smallCarWashUpsert.create.data.price), currencies.GBP)
    } as ServiceEssential,
    mediumCarWash: {
        id: serviceId(mediumCarWashUpsert.create.data.id),
        price: price(toNumber(mediumCarWashUpsert.create.data.price), currencies.GBP)
    } as ServiceEssential,
    largeCarWash: {
        id: serviceId(largeCarWashUpsert.create.data.id),
        price: price(toNumber(largeCarWashUpsert.create.data.price), currencies.GBP)
    } as ServiceEssential,
    wax: {
        id: addOnId(wax.create.data.id),
        price: price(toNumber(wax.create.data.price), currencies.GBP)
    } as AddOnEssential,
    polish: {
        id: addOnId(polish.create.data.id),
        price: price(toNumber(polish.create.data.price), currencies.GBP)
    } as AddOnEssential,
    fourToSix: carwash.fourToSix,
    nineToOne: carwash.nineToOne,
}

export async function loadTestCarWashTenant(prisma: PrismaClient): Promise<void> {
    await runUpserts(prisma, [
        upsertTenant({
            tenant_id,
            name: 'Test Car Wash',
            slug: 'tenant1'
        })
    ])
    await runUpserts(prisma, locationUpserts)
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    await runUpserts(prisma, daysOfWeek.map(day => (upsertBusinessHours({
        id: makeTestId(tenant_id, environment_id, `business-hours-${day}`),
            tenant_id,
            environment_id,
            day_of_week: day,
            start_time_24hr: '09:00',
            end_time_24hr: '18:00'
        })))
    )
    const timeslots = ['09:00 to 13:00', '13:00 to 16:00', '16:00 to 18:00']
    await runUpserts(prisma, timeslots.map(timeslot => upsertTimeslot({
        id: makeTestId(tenant_id, environment_id, `timeslot-${timeslot}`),
        tenant_id,
        environment_id,
        description: timeslot,
        start_time_24hr: timeslot.split(' ')[0],
        end_time_24hr: timeslot.split(' ')[2]
    })))
    await runUpserts(prisma, [upsertTimeslot({
        id: makeTestId(tenant_id, environment_id, 'timeslot-11-to-13'),
        tenant_id,
        environment_id,
        description: '11:00 to 13:00',
        start_time_24hr: '11:00',
        end_time_24hr: '13:00',
        location_id: liverpoolUpsert.create.data.id
    })])
    const [vanResourceTypeUpsert] = await runUpserts(prisma, [
        upsertResourceType({
            id: makeTestId(tenant_id, environment_id, 'resourceType-van'),
            tenant_id,
            environment_id,
            name: 'van'
        })
    ])
    const vans = ['Van1', 'Van2']
    const vanUpserts = await runUpserts(prisma, vans.map(van =>
        upsertResource({
            id: makeTestId(tenant_id, environment_id, `resource-${van}`),
            tenant_id,
            environment_id,
            name: van,
            resource_type: vanResourceTypeUpsert.create.data.id
        })))
    await runUpserts(prisma, vanUpserts.flatMap(van => daysOfWeek.map(day => upsertResourceAvailability({
        id: makeTestId(tenant_id, environment_id, `resource-availability-${van.create.data.id}-${day}`),
        tenant_id,
        environment_id,
        resource_id: van.create.data.id,
        day_of_week: day,
        start_time_24hr: '09:00',
        end_time_24hr: '18:00'

    }))))
    await runUpserts(prisma, addOnUpserts)

    const forms: JsonSchemaForm[] = [carDetailsForm, contactDetailsForm]
    const [carDetailsFormUpsert, contactDetailsFormUpsert] = await runUpserts(prisma, forms.map((form) => upsertForm({
        id: makeTestId(tenant_id, environment_id, form.id.value),
        tenant_id,
        environment_id,
        name: form.name,
        description: form.description ?? form.name,
        definition: form as any
    })))
    await runUpserts(prisma, [upsertTenantSettings({
        tenant_id,
        environment_id,
        customer_form_id: contactDetailsFormUpsert.create.data.id,
        iana_timezone: 'Europe/London'
    })])
    await runUpserts(prisma, serviceUpserts)
    await runUpserts(prisma, serviceUpserts.flatMap((serviceUpsert) => {
        const labels = carwash.serviceLabels.filter(l => {
            const slug = l.serviceId.value.replace('/.id/', '');
            const serviceId = makeTestId(tenant_id, environment_id, slug)
            return serviceId === serviceUpsert.create.data.id;
        });
        if(labels.length === 0) {
            throw new Error(`No labels found for service ${serviceUpsert.create.data.id}`)
        }
        return labels.map(l => upsertServiceLabel({
            tenant_id,
            environment_id,
            service_id: serviceUpsert.create.data.id,
            language_id: l.languageId.value,
            name: l.name,
            description: l.description
        }))
    }))
    await runUpserts(prisma, serviceUpserts.map((serviceUpsert) => upsertServiceResourceRequirement({
        id: makeTestId(tenant_id, environment_id, `service-requirement-${serviceUpsert.create.data.id}`),
        service_id: serviceUpsert.create.data.id,
        tenant_id,
        environment_id,
        requirement_type: 'any_suitable',
        resource_type: vanResourceTypeUpsert.create.data.id
    })))
    await runUpserts(prisma, serviceUpserts.map(serviceUpsert => upsertServiceLocation({
        tenant_id,
        environment_id,
        service_id: serviceUpsert.create.data.id,
        location_id: londonUpsert.create.data.id
    })))
    await runUpserts(prisma, serviceUpserts.map(serviceUpsert => upsertServiceForm({
        tenant_id,
        environment_id,
        service_id: serviceUpsert.create.data.id,
        form_id: carDetailsFormUpsert.create.data.id,
        rank: 0
    })))
    await runUpserts(prisma, carwash.pricingRules.map((pricingRule, index) => upsertPricingRule({
        id: makeTestId(tenant_id, environment_id, `pricing-rule-${index}`),
        tenant_id,
        environment_id,
        rank: index,
        active: true,
        definition: pricingRule as any
    })))
    await runUpserts(prisma, Object.values(carwash.coupons).map((coupon, index) => upsertCoupon({
        id: makeTestId(tenant_id, environment_id, `coupon-${index}`),
            tenant_id,
            environment_id,
            code: coupon.code.value,
            start_date: coupon.validFrom.value,
            end_date: coupon.validTo ? coupon.validTo.value : null,
            definition: coupon as any
        }))
    )
    await runUpserts(prisma, serviceUpserts.map(serviceUpsert => {
        const serviceId = serviceUpsert.create.data.id;
        return upsertServiceImage({
            service_id: serviceId,
            tenant_id,
            environment_id,
            mime_type: 'image/png',
            context: 'thumbnail',
            public_image_url: `https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/tenant1/${serviceId}.png`

        });
    }))
    await runUpserts(prisma, [upsertTenantImage({
        tenant_id,
        environment_id,
        mime_type: 'image/png',
        context: 'hero',
        public_image_url: `https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/tenant1/thesmartwash-hero.png`

    })])
    await runUpserts(prisma, [
        upsertTenantBranding({
            tenant_id,
            environment_id,
            headline: 'The Smart Wash',
            description: 'The Smart Wash is the best car wash in the world',
        })
    ])
}


export async function ensureStripeKeys(tenantEnvironment: TenantEnvironment): Promise<void> {
    const maybeExistingSecretKey = await maybeGetTenantSecret(tenantEnvironment, STRIPE_API_KEY_SECRET_NAME)
    if (!maybeExistingSecretKey && process.env.TEST_STRIPE_SECRET_KEY) {
        await storeTenantSecret(tenantEnvironment, STRIPE_API_KEY_SECRET_NAME, 'Test Stripe Secret Key', process.env.TEST_STRIPE_SECRET_KEY)
    }
    const maybeExistingPublishableKey = await maybeGetTenantSecret(tenantEnvironment, STRIPE_PUBLIC_KEY_SECRET_NAME)
    if (!maybeExistingPublishableKey && process.env.TEST_STRIPE_PUBLIC_KEY) {
        await storeTenantSecret(tenantEnvironment, STRIPE_PUBLIC_KEY_SECRET_NAME, 'Test Stripe Publishable Key', process.env.TEST_STRIPE_PUBLIC_KEY)
    }
}

const carDetailsForm: JsonSchemaForm = {
    "_type": "json.schema.form",
    "id": {
        "_type": "form.id",
        "value": "car-details-form"
    },
    "name": "Car Details Form",
    "schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "make": {
                "type": "string",
                "description": "The manufacturer of the car."
            },
            "model": {
                "type": "string",
                "description": "The model of the car."
            },
            "colour": {
                "type": "string",
                "description": "The color of the car."
            },
            "year": {
                "type": "integer",
                "description": "The manufacturing year of the car."
            },
            "firstLineOfAddress": {
                "type": "string",
                "description": "The first line of your address."
            },
            "postcode": {
                "type": "string",
                "description": "Your postcode."
            }
        },
        "required": [
            "make",
            "model",
            "colour",
            "year",
            "firstLineOfAddress",
            "postcode"
        ],
        "additionalProperties": false
    }
};
const contactDetailsForm: JsonSchemaForm = {
    "_type": "json.schema.form",
    "id": {
        "_type": "form.id",
        "value": "contact-details-form"
    },
    "name": "Customer Details Form",
    "schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "age": {
                "type": "number",
                "description": "Just a test property"
            }
        },
        "required": [
            "age"
        ],
        "additionalProperties": false
    }
};
