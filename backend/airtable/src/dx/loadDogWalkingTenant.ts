import {Upsert} from "../mutation/mutations.js";
import {
    upsertBusinessHours,
    upsertForm,
    upsertFormLabels,
    upsertLocation,
    upsertResource,
    upsertResourceAvailability,
    upsertResourceType,
    upsertService,
    upsertServiceLabel,
    upsertServiceLocation,
    upsertServiceOption,
    upsertServiceOptionForm,
    upsertServiceOptionLabel,
    upsertServiceResourceRequirement,
    upsertServiceServiceOption,
    upsertServiceTimeslot,
    upsertTenant,
    upsertTenantSettings,
    upsertTimeslot
} from "../prisma/breezPrismaMutations.js";
import {makeTestId} from "./testIds.js";
import {JsonSchemaForm, jsonSchemaFormLabels, languages, schemaKeyLabel} from "@breezbook/packages-types";
import {PrismaClient} from "@prisma/client";
import {runUpserts} from "./loadMultiLocationGymTenant.js";

const tenant_id = 'breezbook-dog-walks';
const environment_id = 'dev';

export async function loadDogWalkingTenant(prisma: PrismaClient): Promise<void> {
    await runUpserts(prisma, breezbookDogWalkUpserts());
}

function breezbookDogWalkUpserts(): Upsert[] {
    const mondayToFriday = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const satSun = ['Saturday', 'Sunday']
    const daysOfWeek = [...mondayToFriday, ...satSun]
    const start_time_24hr = '09:00';
    const end_time_24hr = '18:00';
    const dogWalkerResourceTypeId = makeTestId(tenant_id, environment_id, `resource_type.walker`);
    const resourceAlexId = makeTestId(tenant_id, environment_id, `resource.alex`);

    return [

        upsertTenant({
            tenant_id,
            name: 'Breez Walks',
            slug: tenant_id
        }),
        upsertLocation({
            id: makeTestId(tenant_id, environment_id, 'main'),
            tenant_id,
            environment_id,
            name: 'Main',
            slug: 'main',
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
            name: "Walker"
        }),
        upsertResource({
            id: resourceAlexId,
            tenant_id,
            environment_id,
            name: "Alex",
            resource_type: dogWalkerResourceTypeId
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
        upsertTenantSettings({
                tenant_id,
                environment_id,
                customer_form_id: null,
                iana_timezone: 'Europe/London'
            }
        ),
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
            id: makeTestId(tenant_id, environment_id, 'extra_30_minutes'),
            tenant_id,
            environment_id,
            price: 800,
            price_currency: 'GBP',
            requires_quantity: false,
            duration_minutes: 30
        }),
        upsertServiceOption({
            id: makeTestId(tenant_id, environment_id, 'extra_60_minutes'),
            tenant_id,
            environment_id,
            price: 1200,
            price_currency: 'GBP',
            requires_quantity: false,
            duration_minutes: 60
        }),
        upsertServiceOption({
            id: makeTestId(tenant_id, environment_id, 'extra_dog.1'),
            tenant_id,
            environment_id,
            price: 800,
            price_currency: 'GBP',
            requires_quantity: false,
            duration_minutes: 0
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
            service_option_id: makeTestId(tenant_id, environment_id, 'extra_30_minutes'),
            language_id: languages.en.value,
            name: 'Extra 30 minutes',
            description: 'Add 30 minutes to your dog walk'
        }),
        upsertServiceOptionLabel({
            tenant_id,
            environment_id,
            service_option_id: makeTestId(tenant_id, environment_id, 'extra_60_minutes'),
            language_id: languages.en.value,
            name: 'Extra 60 minutes',
            description: 'Add 60 minutes to your dog walk'
        }),
        upsertServiceOptionLabel({
            tenant_id,
            environment_id,
            service_option_id: makeTestId(tenant_id, environment_id, 'extra_dog.1'),
            language_id: languages.en.value,
            name: 'Extra dog from the same household',
            description: 'Add an extra dog from the same household'
        }),

        upsertService({
            tenant_id,
            environment_id,
            id: makeTestId(tenant_id, environment_id, 'individual-dog-walk'),
            slug: 'individual_dog_walk',
            duration_minutes: 60,
            price: 1500,
            price_currency: 'GBP',
            permitted_add_on_ids: [],
            requires_time_slot: false
        }),
        upsertServiceLabel({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'individual-dog-walk'),
            language_id: languages.en.value,
            name: 'Individual dog walk',
            description: 'A 60-min walk for your dog',
        }),
        upsertServiceServiceOption({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'individual-dog-walk'),
            service_option_id: makeTestId(tenant_id, environment_id, 'extra_30_minutes')
        }),
        upsertServiceServiceOption({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'individual-dog-walk'),
            service_option_id: makeTestId(tenant_id, environment_id, 'extra_60_minutes')
        }),
        upsertServiceServiceOption({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'individual-dog-walk'),
            service_option_id: makeTestId(tenant_id, environment_id, 'extra_dog.1')
        }),


        upsertService({
            tenant_id,
            environment_id,
            id: makeTestId(tenant_id, environment_id, 'group-dog-walk'),
            slug: 'group_dog_walk',
            duration_minutes: 60,
            price: 1200,
            price_currency: 'GBP',
            permitted_add_on_ids: [],
            requires_time_slot: true,
            capacity: 5
        }),
        upsertServiceServiceOption({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'group-dog-walk'),
            service_option_id: makeTestId(tenant_id, environment_id, 'extra_dog.1')
        }),

        upsertServiceLabel({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'group-dog-walk'),
            language_id: languages.en.value,
            name: 'Group dog walk',
            description: 'A 60-min walk for your dog with 3 - 5 other dogs',
        }),
        upsertTimeslot({
            id: makeTestId(tenant_id, environment_id, 'group_dog_walk_morning'),
            tenant_id,
            environment_id,
            location_id: makeTestId(tenant_id, environment_id, 'main'),
            description: 'Morning group dog walk',
            start_time_24hr: '09:00',
            end_time_24hr: '10:00'
        }),
        upsertTimeslot({
            id: makeTestId(tenant_id, environment_id, 'group_dog_walk_evening'),
            tenant_id,
            environment_id,
            location_id: makeTestId(tenant_id, environment_id, 'main'),
            description: 'Evening group dog walk',
            start_time_24hr: '17:00',
            end_time_24hr: '18:00'
        }),
        upsertServiceTimeslot({
            id: makeTestId(tenant_id, environment_id, 'group_dog_walk_morning'),
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'group-dog-walk'),
            time_slot_id: makeTestId(tenant_id, environment_id, 'group_dog_walk_morning')
        }),
        upsertServiceTimeslot({
            id: makeTestId(tenant_id, environment_id, 'group_dog_walk_evening'),
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'group-dog-walk'),
            time_slot_id: makeTestId(tenant_id, environment_id, 'group_dog_walk_evening')
        }),

        upsertService({
            tenant_id,
            environment_id,
            id: makeTestId(tenant_id, environment_id, 'drop_in_visit'),
            slug: 'drop_in_visit',
            duration_minutes: 30,
            price: 1200,
            price_currency: 'GBP',
            permitted_add_on_ids: [],
            requires_time_slot: false
        }),
        upsertServiceLabel({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'drop_in_visit'),
            language_id: languages.en.value,
            name: 'Drop in visit',
            description: 'We will visit your dog in your home for a quick check-in and playtime',
        }),
        upsertServiceServiceOption({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'drop_in_visit'),
            service_option_id: makeTestId(tenant_id, environment_id, 'extra_30_minutes')
        }),


        upsertService({
            tenant_id,
            environment_id,
            id: makeTestId(tenant_id, environment_id, 'pet_sit'),
            slug: 'pet_sit',
            duration_minutes: 120,
            price: 2500,
            price_currency: 'GBP',
            permitted_add_on_ids: [],
            requires_time_slot: false
        }),
        upsertServiceLabel({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'pet_sit'),
            language_id: languages.en.value,
            name: 'Pet sit',
            description: 'We will stay with your dog in your home',
        }),
        upsertServiceServiceOption({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'pet_sit'),
            service_option_id: makeTestId(tenant_id, environment_id, 'extra_30_minutes')
        }),
        upsertServiceServiceOption({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'pet_sit'),
            service_option_id: makeTestId(tenant_id, environment_id, 'extra_60_minutes')
        }),
        upsertServiceResourceRequirement({
            id: makeTestId(tenant_id, environment_id, 'pet_sit_requirement'),
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'pet_sit'),
            requirement_type: 'any_suitable',
            resource_type: dogWalkerResourceTypeId,
        }),
        upsertServiceResourceRequirement({
            id: makeTestId(tenant_id, environment_id, 'group_dog_walk_requirement'),
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'group-dog-walk'),
            requirement_type: 'any_suitable',
            resource_type: dogWalkerResourceTypeId,
        }),
        upsertServiceResourceRequirement({
            id: makeTestId(tenant_id, environment_id, 'individual_dog_walk_requirement'),
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'individual-dog-walk'),
            requirement_type: 'any_suitable',
            resource_type: dogWalkerResourceTypeId,
        }),
        upsertServiceResourceRequirement({
            id: makeTestId(tenant_id, environment_id, 'drop_in_visit_requirement'),
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'drop_in_visit'),
            requirement_type: 'any_suitable',
            resource_type: dogWalkerResourceTypeId,
        }),

        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'individual-dog-walk'),
            location_id: makeTestId(tenant_id, environment_id, 'main')
        }),
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'group-dog-walk'),
            location_id: makeTestId(tenant_id, environment_id, 'main')
        }),
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'drop_in_visit'),
            location_id: makeTestId(tenant_id, environment_id, 'main')
        }),
        upsertServiceLocation({
            tenant_id,
            environment_id,
            service_id: makeTestId(tenant_id, environment_id, 'pet_sit'),
            location_id: makeTestId(tenant_id, environment_id, 'main')
        }),

    ]
}

const dogDetailsForm: JsonSchemaForm = {
    "_type": "json.schema.form",
    "id": {
        "_type": "form.id",
        "value": "pet-details-form"
    },
    "name": "Your dog's details",
    "schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "dogsName": {
                "type": "string"
            },
        },
        "required": [
            "dogsName",
        ],
        "additionalProperties": false
    }
};

const secondDogDetailsForm: JsonSchemaForm = {
    "_type": "json.schema.form",
    "id": {
        "_type": "form.id",
        "value": "second-dog-details-form"
    },
    "name": "Your second dog's details",
    "schema": {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "properties": {
            "secondDogsName": {
                "type": "string"
            },
        },
        "required": [
            "secondDogsName",
        ],
        "additionalProperties": false
    }
};

const dogDetailsFormLabelsEnglish = jsonSchemaFormLabels(dogDetailsForm.id, languages.en, "Your dog's details",
    [schemaKeyLabel("dogsName", "Dog's name")])

const secondDogDetailsFormLabelsEnglish = jsonSchemaFormLabels(secondDogDetailsForm.id, languages.en, "Your second dog's details", [
    schemaKeyLabel("secondDogsName", "Dog's name")
], "Your second dog's name")

