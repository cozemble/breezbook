
-- Function to insert booking data into system_outbound_webhooks on creation
create or replace function inserted_booking_webhook() returns trigger as
$$
begin
    insert into system_outbound_webhooks (environment_id, action, payload_type, payload)
    values (new.environment_id, 'create', 'booking', row_to_json(new));

    return new;
end;
$$ language plpgsql;

create trigger booking_create_notify
    after insert
    on bookings
    for each row
execute function inserted_booking_webhook();

-- function to insert booking data into system_outbound_webhooks on update
create or replace function updated_booking_webhook() returns trigger as
$$
begin
    insert into system_outbound_webhooks (environment_id, action, payload_type, payload)
    values (new.environment_id, 'update', 'booking', row_to_json(new));

    return new;
end;
$$ language plpgsql;

create trigger booking_update_notify
    after update
    on bookings
    for each row
execute function updated_booking_webhook();

-- function to insert booking data into system_outbound_webhooks on deletion
create or replace function deleted_booking_webhook() returns trigger as
$$
begin
    insert into system_outbound_webhooks (environment_id, action, payload_type, payload)
    values (old.environment_id, 'delete', 'booking', row_to_json(old));

    return old;
end;
$$ language plpgsql;

create trigger booking_delete_notify
    after delete
    on bookings
    for each row
execute function deleted_booking_webhook();