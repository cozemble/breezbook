import {PrismaClient} from '@prisma/client';
import {carwash, JsonSchemaForm} from "@breezbook/packages-core";

export async function loadTestCarWashTenant(prisma: PrismaClient): Promise<void> {
    const tenant_id = 'tenant1';
    const environment_id = 'dev';
    await prisma.tenants.create({
        data: {
            tenant_id,
            name: 'Test Car Wash',
            slug: 'tenant1'
        }
    })
    await prisma.locations.create({
        data: {
            id: "tenant1.dev.europe.uk.london",
            tenant_id,
            environment_id,
            name: 'London',
            slug: 'london',
        }
    });
    await prisma.locations.create({
        data: {
            id: "tenant1.dev.europe.uk.liverpool",
            tenant_id,
            environment_id,
            name: 'Liverpool',
            slug: 'liverpool',
        }
    });
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    await prisma.business_hours.createMany({
        data: daysOfWeek.map((day, index) => ({
            id: `businessHours#${index + 1}`,
            tenant_id,
            environment_id,
            day_of_week: day,
            start_time_24hr: '09:00',
            end_time_24hr: '18:00'

        }))
    });
    const timeslots = ['09:00 to 13:00', '13:00 to 16:00', '16:00 to 18:00']
    await prisma.time_slots.createMany({
        data: timeslots.map((timeslot, index) => ({
            id: `timeSlot#${index + 1}`,
            tenant_id,
            environment_id,
            description: timeslot,
            start_time_24hr: timeslot.split(' ')[0],
            end_time_24hr: timeslot.split(' ')[2]
        }))
    });
    await prisma.time_slots.create({
        data: {
            id: 'timeSlot#4',
            tenant_id,
            environment_id,
            description: '11:00 to 13:00',
            start_time_24hr: '11:00',
            end_time_24hr: '13:00',
            location_id: 'tenant1.dev.europe.uk.liverpool'
        }
    });
    await prisma.resource_types.create({
        data: {
            id: 'vanResourceType',
            tenant_id,
            environment_id,
            name: 'van'
        }
    });
    const vans = ['Van1', 'Van2']
    await prisma.resources.createMany({
        data: vans.map((van, index) => ({
            id: `van#${index + 1}`,
            tenant_id,
            environment_id,
            name: van,
            resource_type: 'vanResourceType'
        }))
    });
    await prisma.resource_availability.createMany({
        data: vans.flatMap((van, index) => daysOfWeek.map((day, dayIndex) => ({
            id: `resourceAvailability#${index + 1}#${dayIndex + 1}`,
            tenant_id,
            environment_id,
            resource_id: `van#${index + 1}`,
            day_of_week: day,
            start_time_24hr: '09:00',
            end_time_24hr: '18:00'
        })))
    });
    const addOns = carwash.addOns;
    const addOnIds: string[] = []
    await prisma.add_on.createMany({
        data: addOns.map((addOn) => {
            const id = addOn.id.value;
            addOnIds.push(id)
            return ({
                id,
                tenant_id,
                environment_id,
                name: addOn.name,
                price: addOn.price.amount.value,
                price_currency: addOn.price.currency.value,
                expect_quantity: addOn.requiresQuantity,
                description: addOn.description
            });
        })
    });
    const forms: JsonSchemaForm[] = [carDetailsForm, contactDetailsForm]
    await prisma.forms.createMany({
        data: forms.map((form) => ({
            id: form.id.value,
            tenant_id,
            environment_id,
            name: form.name,
            description: form.description ?? form.name,
            definition: form as any
        }))
    });
    await prisma.tenant_settings.create({
        data: {
            tenant_id,
            environment_id,
            customer_form_id: contactDetailsForm.id.value,
            iana_timezone: 'Europe/London'
        }
    });
    await prisma.services.createMany({
        data: carwash.services.map((service) => ({
            id: service.id.value,
            tenant_id,
            environment_id,
            slug: service.id.value.replace('/.id/', ''),
            name: service.name,
            description: service.description,
            duration_minutes: service.duration,
            price: service.price.amount.value,
            price_currency: service.price.currency.value,
            permitted_add_on_ids: addOnIds,
            resource_types_required: ['vanResourceType'],
            requires_time_slot: true
        }))
    });
    await prisma.service_forms.createMany({
        data: carwash.services.map((service) => ({
            tenant_id,
            environment_id,
            service_id: service.id.value,
            form_id: carDetailsForm.id.value,
            rank: 0
        }))
    });
    await prisma.pricing_rules.createMany({
        data: carwash.pricingRules.map((pricingRule, index) => ({
            id: `pricingRule#${index + 1}`,
            tenant_id,
            environment_id,
            rank: index,
            active: true,
            definition: pricingRule as any
        }))
    });
    await prisma.coupons.createMany({
        data: carwash.coupons.map((coupon, index) => ({
            id: `coupon#${index + 1}`,
            tenant_id,
            environment_id,
            code: coupon.code.value,
            start_date: coupon.validFrom.value,
            end_date: coupon.validTo ? coupon.validTo.value : null,
            definition: coupon as any
        }))
    });
    await prisma.service_images.createMany({
        data: carwash.services.map((service) => ({
            service_id: service.id.value,
            tenant_id,
            environment_id,
            mime_type: 'image/png',
            context: 'thumbnail',
            public_image_url: `https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/tenant1/${service.id.value}.png`
        }))
    });
    await prisma.tenant_images.create({
        data: {
            tenant_id,
            environment_id,
            mime_type: 'image/png',
            context: 'hero',
            public_image_url: `https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/tenant1/thesmartwash-hero.png`
        }

    });
    await prisma.tenant_branding.create({
        data: {
            tenant_id,
            environment_id,
            slug: 'tenant1',
        }
    });
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
            }
        },
        "required": [
            "make",
            "model",
            "colour",
            "year"
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
            "phone": {
                "type": "string",
                "description": "Your phone number."
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
            "phone",
            "firstLineOfAddress",
            "postcode"
        ],
        "additionalProperties": false
    }
};
