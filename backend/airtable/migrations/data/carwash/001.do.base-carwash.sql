insert into tenants (tenant_id, name)
values ('tenant1', 'carwash');

insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#1', 'tenant1', 'Monday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#2', 'tenant1', 'Tuesday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#3', 'tenant1', 'Wednesday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#4', 'tenant1', 'Thursday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#5', 'tenant1', 'Friday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#6', 'tenant1', 'Saturday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#7', 'tenant1', 'Sunday', '09:00', '18:00');

insert into time_slots(id, tenant_id, description, start_time_24hr, end_time_24hr)
values ('timeSlot#1', 'tenant1', '09:00 to 13:00', '09:00', '13:00');
insert into time_slots(id, tenant_id, description, start_time_24hr, end_time_24hr)
values ('timeSlot#2', 'tenant1', '13:00 to 16:00', '13:00', '16:00');
insert into time_slots(id, tenant_id, description, start_time_24hr, end_time_24hr)
values ('timeSlot#3', 'tenant1', '16:00 to 18:00', '16:00', '18:00');

insert into resource_types (id, tenant_id, name)
values ('vanResourceType', 'tenant1', 'van');
insert into resources(id, tenant_id, resource_type, name)
values ('resource#1', 'tenant1', 'vanResourceType', 'Van 1');
insert into resources(id, tenant_id, resource_type, name)
values ('resource#2', 'tenant1', 'vanResourceType', 'Van 2');

insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#1', 'tenant1', 'resource#1', 'Monday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#2', 'tenant1', 'resource#1', 'Tuesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#3', 'tenant1', 'resource#1', 'Wednesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#4', 'tenant1', 'resource#1', 'Thursday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#5', 'tenant1', 'resource#1', 'Friday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#6', 'tenant1', 'resource#1', 'Saturday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#7', 'tenant1', 'resource#1', 'Sunday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#8', 'tenant1', 'resource#2', 'Monday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#9', 'tenant1', 'resource#2', 'Tuesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#10', 'tenant1', 'resource#2', 'Wednesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#11', 'tenant1', 'resource#2', 'Thursday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#12', 'tenant1', 'resource#2', 'Friday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#13', 'tenant1', 'resource#2', 'Saturday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#14', 'tenant1', 'resource#2', 'Sunday', '09:00', '18:00');

insert into add_on(id, tenant_id, name, price, price_currency, expect_quantity)
values ('addOn#1', 'tenant1', 'Wax', 1000, 'GBP', false);
insert into add_on(id, tenant_id, name, price, price_currency, expect_quantity)
values ('addOn#2', 'tenant1', 'Polish', 500, 'GBP', false);
insert into add_on(id, tenant_id, name, price, price_currency, expect_quantity)
values ('addOn#3', 'tenant1', 'Clean seats', 2000, 'GBP', true);
insert into add_on(id, tenant_id, name, price, price_currency, expect_quantity)
values ('addOn#4', 'tenant1', 'Clean carpets', 2000, 'GBP', false);

insert into forms (id, tenant_id, name, description, definition)
values ('car-details-form',
        'tenant1',
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

insert into forms (id, tenant_id, name, description, definition)
values ('contact-details-form',
        'tenant1',
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

insert into tenant_settings(tenant_id, customer_form_id)
values ('tenant1', 'contact-details-form');

insert into services(id, tenant_id, service_id, name, description, duration_minutes, price, price_currency,
                     permitted_add_on_ids, resource_types_required, requires_time_slot)
values ('smallCarWash', 'tenant1', 'service#1', 'Small Car wash', 'Small Car wash', 30, 1000, 'GBP',
        array ['addOn#1', 'addOn#2'], array ['vanResourceType'], true);

insert into services(id, tenant_id, service_id, name, description, duration_minutes, price, price_currency,
                     permitted_add_on_ids, resource_types_required, requires_time_slot)
values ('mediumCarWash', 'tenant1', 'service#2', 'Medium Car wash', 'Medium Car wash', 45, 1500, 'GBP',
        array ['addOn#1', 'addOn#2'], array ['vanResourceType'], true);

insert into services(id, tenant_id, service_id, name, description, duration_minutes, price, price_currency,
                     permitted_add_on_ids, resource_types_required, requires_time_slot)
values ('largeCarWash', 'tenant1', 'service#3', 'Large Car wash', 'Large Car wash', 60, 2000, 'GBP',
        array ['addOn#1', 'addOn#2', 'addOn#3', 'addOn#4'], array ['vanResourceType'], true);

insert into service_forms(tenant_id, s_id, form_id, rank)
values ('tenant1', 'smallCarWash', 'car-details-form', 0);
insert into service_forms(tenant_id, s_id, form_id, rank)
values ('tenant1', 'mediumCarWash', 'car-details-form', 0);
insert into service_forms(tenant_id, s_id, form_id, rank)
values ('tenant1', 'largeCarWash', 'car-details-form', 0);