insert into tenants (tenant_id, name, slug)
values ('tenant1', 'carwash', 'tenant1');

insert into locations(id, tenant_id, environment_id, name, slug, location_path)
values ('1edbefef-a98a-499c-9621-431e19cc422f', 'tenant1', 'dev', 'London', 'london', 'europe.uk.london');

insert into business_hours(id, tenant_id, environment_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#1', 'tenant1', 'dev', 'Monday', '09:00', '18:00');
insert into business_hours(id, tenant_id, environment_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#2', 'tenant1', 'dev', 'Tuesday', '09:00', '18:00');
insert into business_hours(id, tenant_id, environment_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#3', 'tenant1', 'dev', 'Wednesday', '09:00', '18:00');
insert into business_hours(id, tenant_id, environment_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#4', 'tenant1', 'dev', 'Thursday', '09:00', '18:00');
insert into business_hours(id, tenant_id, environment_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#5', 'tenant1', 'dev', 'Friday', '09:00', '18:00');
insert into business_hours(id, tenant_id, environment_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#6', 'tenant1', 'dev', 'Saturday', '09:00', '18:00');
insert into business_hours(id, tenant_id, environment_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#7', 'tenant1', 'dev', 'Sunday', '09:00', '18:00');

insert into time_slots(id, tenant_id, environment_id, description, start_time_24hr, end_time_24hr)
values ('timeSlot#1', 'tenant1', 'dev', '09:00 to 13:00', '09:00', '13:00');
insert into time_slots(id, tenant_id, environment_id, description, start_time_24hr, end_time_24hr)
values ('timeSlot#2', 'tenant1', 'dev', '13:00 to 16:00', '13:00', '16:00');
insert into time_slots(id, tenant_id, environment_id, description, start_time_24hr, end_time_24hr)
values ('timeSlot#3', 'tenant1', 'dev', '16:00 to 18:00', '16:00', '18:00');

insert into resource_types (id, tenant_id, environment_id, name)
values ('vanResourceType', 'tenant1', 'dev', 'van');
insert into resources(id, tenant_id, environment_id, resource_type, name)
values ('resource#1', 'tenant1', 'dev', 'vanResourceType', 'Van 1');
insert into resources(id, tenant_id, environment_id, resource_type, name)
values ('resource#2', 'tenant1', 'dev', 'vanResourceType', 'Van 2');

insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#1', 'tenant1', 'dev', 'resource#1', 'Monday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#2', 'tenant1', 'dev', 'resource#1', 'Tuesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#3', 'tenant1', 'dev', 'resource#1', 'Wednesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#4', 'tenant1', 'dev', 'resource#1', 'Thursday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#5', 'tenant1', 'dev', 'resource#1', 'Friday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#6', 'tenant1', 'dev', 'resource#1', 'Saturday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#7', 'tenant1', 'dev', 'resource#1', 'Sunday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#8', 'tenant1', 'dev', 'resource#2', 'Monday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#9', 'tenant1', 'dev', 'resource#2', 'Tuesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#10', 'tenant1', 'dev', 'resource#2', 'Wednesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#11', 'tenant1', 'dev', 'resource#2', 'Thursday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#12', 'tenant1', 'dev', 'resource#2', 'Friday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#13', 'tenant1', 'dev', 'resource#2', 'Saturday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, environment_id, resource_id, day_of_week, start_time_24hr,
                                  end_time_24hr)
values ('resourceAvailability#14', 'tenant1', 'dev', 'resource#2', 'Sunday', '09:00', '18:00');

insert into add_on(id, tenant_id, environment_id, name, price, price_currency, expect_quantity, description)
values ('addOn-wax', 'tenant1', 'dev', 'Wax', 1000, 'GBP', false, 'Wax the car');
insert into add_on(id, tenant_id, environment_id, name, price, price_currency, expect_quantity, description)
values ('addOn-polish', 'tenant1', 'dev', 'Polish', 500, 'GBP', false, 'Polish the car');
insert into add_on(id, tenant_id, environment_id, name, price, price_currency, expect_quantity, description)
values ('addOn-clean-seats', 'tenant1', 'dev', 'Clean seats', 2000, 'GBP', true, 'Clean the seats');
insert into add_on(id, tenant_id, environment_id, name, price, price_currency, expect_quantity, description)
values ('addOn-clean-carpets', 'tenant1', 'dev', 'Clean carpets', 2000, 'GBP', false, 'Clean the carpets');

insert into forms (id, tenant_id, environment_id, name, description, definition)
values ('car-details-form',
        'tenant1',
        'dev',
        'Car details',
        'Car details',
        '{
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
        }
        ');

insert into forms (id, tenant_id, environment_id, name, description, definition)
values ('contact-details-form',
        'tenant1',
        'dev',
        'Contact Details',
        'Contact Details Form',
        '{
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
        }');

insert into tenant_settings(tenant_id, environment_id, customer_form_id, iana_timezone)
values ('tenant1', 'dev', 'contact-details-form', 'Europe/London');

insert into services(id, tenant_id, environment_id, slug, name, description, duration_minutes, price,
                     price_currency,
                     permitted_add_on_ids, resource_types_required, requires_time_slot)
values ('smallCarWash.id', 'tenant1', 'dev', 'smallCarWash', 'Small Car wash', 'Small Car wash', 30, 1000, 'GBP',
        array ['addOn-wax', 'addOn-polish'], array ['vanResourceType'], true);

insert into services(id, tenant_id, environment_id, slug, name, description, duration_minutes, price,
                     price_currency,
                     permitted_add_on_ids, resource_types_required, requires_time_slot)
values ('mediumCarWash.id', 'tenant1', 'dev', 'mediumCarWash', 'Medium Car wash', 'Medium Car wash', 45, 1500, 'GBP',
        array ['addOn-wax', 'addOn-polish'], array ['vanResourceType'], true);

insert into services(id, tenant_id, environment_id, slug, name, description, duration_minutes, price,
                     price_currency,
                     permitted_add_on_ids, resource_types_required, requires_time_slot)
values ('largeCarWash.id', 'tenant1', 'dev', 'largeCarWash', 'Large Car wash', 'Large Car wash', 60, 2000, 'GBP',
        array ['addOn-wax', 'addOn-polish', 'addOn-clean-seats', 'addOn-clean-carpets'], array ['vanResourceType'],
        true);

insert into service_forms(tenant_id, environment_id, service_id, form_id, rank)
values ('tenant1', 'dev', 'smallCarWash.id', 'car-details-form', 0);
insert into service_forms(tenant_id, environment_id, service_id, form_id, rank)
values ('tenant1', 'dev', 'mediumCarWash.id', 'car-details-form', 0);
insert into service_forms(tenant_id, environment_id, service_id, form_id, rank)
values ('tenant1', 'dev', 'largeCarWash.id', 'car-details-form', 0);

insert into pricing_rules(id, tenant_id, environment_id, rank, active, definition)
values ('40% more today', 'tenant1', 'dev', 0, true, '{
  "_type": "time.based.price.adjustment.spec",
  "id": {
    "_type": "id",
    "value": "40% more today"
  },
  "timeSpec": {
    "_type": "days.from.time.spec",
    "relativeTo": "today",
    "days": 0
  },
  "adjustment": {
    "_type": "percentage.based.price.adjustment",
    "percentage": 0.4
  }
}');

insert into pricing_rules(id, tenant_id, environment_id, rank, active, definition)
values ('25% more tomorrow', 'tenant1', 'dev', 1, true, '{
  "_type": "time.based.price.adjustment.spec",
  "id": {
    "_type": "id",
    "value": "25% more tomorrow"
  },
  "timeSpec": {
    "_type": "days.from.time.spec",
    "relativeTo": "today",
    "days": 1
  },
  "adjustment": {
    "_type": "percentage.based.price.adjustment",
    "percentage": 0.25
  }
}');

insert into pricing_rules(id, tenant_id, environment_id, rank, active, definition)
values ('10% more day after tomorrow', 'tenant1', 'dev', 2, true, '{
  "_type": "time.based.price.adjustment.spec",
  "id": {
    "_type": "id",
    "value": "10% more day after tomorrow"
  },
  "timeSpec": {
    "_type": "days.from.time.spec",
    "relativeTo": "today",
    "days": 2
  },
  "adjustment": {
    "_type": "percentage.based.price.adjustment",
    "percentage": 0.1
  }
}');

insert into coupons(id, tenant_id, environment_id, code, start_date, end_date, definition)
values ('fd85db7b-4762-42fb-9a5d-6652e1a05682', 'tenant1', 'dev', 'expired-20-percent-off', '2020-01-01', '2020-12-31',
        '{
          "_type": "coupon",
          "id": {
            "_type": "coupon.id",
            "value": "fd85db7b-4762-42fb-9a5d-6652e1a05682"
          },
          "code": {
            "_type": "coupon.code",
            "value": "expired-20-percent-off"
          },
          "usagePolicy": {
            "_type": "unlimited"
          },
          "value": {
            "_type": "percentage.coupon",
            "percentage": {
              "_type": "percentage.as.ratio",
              "value": 0.2
            }
          },
          "validFrom": {
            "_type": "iso.date",
            "value": "2021-05-23"
          },
          "validTo": {
            "_type": "iso.date",
            "value": "2021-05-26"
          }
        }');

insert into coupons(id, tenant_id, environment_id, code, start_date, definition)
values ('3e2217b1-1c55-4cc4-bdf3-b9be9ed667c3', 'tenant1', 'dev', '20-OFF', '2021-05-23', '{
  "_type": "coupon",
  "id": {
    "_type": "coupon.id",
    "value": "3e2217b1-1c55-4cc4-bdf3-b9be9ed667c3"
  },
  "code": {
    "_type": "coupon.code",
    "value": "20-OFF"
  },
  "usagePolicy": {
    "_type": "unlimited"
  },
  "value": {
    "_type": "percentage.coupon",
    "percentage": {
      "_type": "percentage.as.ratio",
      "value": 0.2
    }
  },
  "validFrom": {
    "_type": "iso.date",
    "value": "2021-05-23"
  }
}');

insert into service_images(service_id, tenant_id, environment_id, public_image_url, mime_type, context)
values ('smallCarWash.id', 'tenant1', 'dev',
        'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/tenant1/smallCarWash.id.png',
        'image/png', 'thumbnail');

insert into service_images(service_id, tenant_id, environment_id, public_image_url, mime_type, context)
values ('mediumCarWash.id', 'tenant1', 'dev',
        'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/tenant1/mediumCarWash.id.png',
        'image/png', 'thumbnail');

insert into service_images(service_id, tenant_id, environment_id, public_image_url, mime_type, context)
values ('largeCarWash.id', 'tenant1', 'dev',
        'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/dev/tenant1/largeCarWash.id.png',
        'image/png', 'thumbnail');

insert into tenant_images(tenant_id, environment_id, public_image_url, mime_type, context)
values ('tenant1', 'dev',
        'https://ltbkixtsgzejkyicczum.supabase.co/storage/v1/object/public/service-images/tenant1/thesmartwash-hero.png',
        'image/png', 'hero');

insert into tenant_branding(tenant_id, environment_id, slug)
values ('tenant1', 'dev', 'tenant1');