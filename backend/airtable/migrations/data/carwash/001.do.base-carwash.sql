insert into tenants (tenant_id, name)
values ('tenant#1', 'carwash');

insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#1', 'tenant#1', 'Monday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#2', 'tenant#1', 'Tuesday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#3', 'tenant#1', 'Wednesday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#4', 'tenant#1', 'Thursday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#5', 'tenant#1', 'Friday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#6', 'tenant#1', 'Saturday', '09:00', '18:00');
insert into business_hours(id, tenant_id, day_of_week, start_time_24hr, end_time_24hr)
values ('businessHours#7', 'tenant#1', 'Sunday', '09:00', '18:00');

insert into time_slots(id, tenant_id, description, start_time_24hr, end_time_24hr)
values ('timeSlot#1', 'tenant#1', '09:00 to 13:00', '09:00', '13:00');
insert into time_slots(id, tenant_id, description, start_time_24hr, end_time_24hr)
values ('timeSlot#2', 'tenant#1', '13:00 to 16:00', '13:00', '16:00');
insert into time_slots(id, tenant_id, description, start_time_24hr, end_time_24hr)
values ('timeSlot#3', 'tenant#1', '16:00 to 18:00', '16:00', '18:00');

insert into resource_types (id, tenant_id, name)
values ('vanResourceType', 'tenant#1', 'van');
insert into resources(id, tenant_id, resource_type, name)
values ('resource#1', 'tenant#1', 'vanResourceType', 'Van 1');
insert into resources(id, tenant_id, resource_type, name)
values ('resource#2', 'tenant#1', 'vanResourceType', 'Van 2');

insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#1', 'tenant#1', 'resource#1', 'Monday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#2', 'tenant#1', 'resource#1', 'Tuesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#3', 'tenant#1', 'resource#1', 'Wednesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#4', 'tenant#1', 'resource#1', 'Thursday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#5', 'tenant#1', 'resource#1', 'Friday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#6', 'tenant#1', 'resource#1', 'Saturday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#7', 'tenant#1', 'resource#1', 'Sunday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#8', 'tenant#1', 'resource#2', 'Monday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#9', 'tenant#1', 'resource#2', 'Tuesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#10', 'tenant#1', 'resource#2', 'Wednesday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#11', 'tenant#1', 'resource#2', 'Thursday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#12', 'tenant#1', 'resource#2', 'Friday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#13', 'tenant#1', 'resource#2', 'Saturday', '09:00', '18:00');
insert into resource_availability(id, tenant_id, resource_id, day_of_week, start_time_24hr, end_time_24hr)
values ('resourceAvailability#14', 'tenant#1', 'resource#2', 'Sunday', '09:00', '18:00');

insert into add_on(id, tenant_id, name, price, price_currency, expect_quantity)
values ('addOn#1', 'tenant#1', 'Wax', 1000, 'GBP', false);
insert into add_on(id, tenant_id, name, price, price_currency, expect_quantity)
values ('addOn#2', 'tenant#1', 'Polish', 500, 'GBP', false);
insert into add_on(id, tenant_id, name, price, price_currency, expect_quantity)
values ('addOn#3', 'tenant#1', 'Clean seats', 2000, 'GBP', true);
insert into add_on(id, tenant_id, name, price, price_currency, expect_quantity)
values ('addOn#4', 'tenant#1', 'Clean carpets', 2000, 'GBP', false);

insert into services(id, tenant_id, service_id, name, description, duration_minutes, price, price_currency,
                     permitted_add_on_ids, resource_types_required)
values ('service#1', 'tenant#1', 'service#1', 'Small Car wash', 'Small Car wash', 30, 1000, 'GBP',
        array['addOn#1', 'addOn#2'], array['vanResourceType']);

insert into services(id, tenant_id, service_id, name, description, duration_minutes, price, price_currency,
                     permitted_add_on_ids, resource_types_required)
values ('service#2', 'tenant#1', 'service#2', 'Medium Car wash', 'Medium Car wash', 45, 1500, 'GBP',
        array['addOn#1', 'addOn#2'], array['vanResourceType']);

insert into services(id, tenant_id, service_id, name, description, duration_minutes, price, price_currency,
                     permitted_add_on_ids, resource_types_required)
values ('service#3', 'tenant#1', 'service#3', 'Large Car wash', 'Large Car wash', 60, 2000, 'GBP',
        array['addOn#1', 'addOn#2', 'addOn#3', 'addOn#4'], array['vanResourceType']);