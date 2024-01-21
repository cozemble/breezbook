create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists pg_net;


create table tenants
(
    tenant_id  text primary key,
    name       text                     not null,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp
);

create table business_hours
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    day_of_week     varchar(10)                         not null,
    start_time_24hr varchar(10)                         not null,
    end_time_24hr   varchar(10)                         not null,
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp
);

create table blocked_time
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    date            text                                not null,
    start_time_24hr text                                not null,
    end_time_24hr   text                                not null,
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp
);

create table resource_types
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    name           text                                not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);

create table resources
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    resource_type  text references resource_types (id) not null,
    name           text                                not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);

create table resource_availability
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id),
    environment_id  text                     not null,
    resource_id     text references resources (id),
    day_of_week     varchar(10)              not null,
    start_time_24hr varchar(10)              not null,
    end_time_24hr   varchar(10)              not null,
    created_at      timestamp with time zone not null default current_timestamp,
    updated_at      timestamp with time zone not null default current_timestamp
);

create table resource_blocked_time
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    resource_id     text references resources (id)      not null,
    date            text                                not null,
    start_time_24hr text                                not null,
    end_time_24hr   text                                not null,
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp
);

create table add_on
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    name            text                                not null,
    description     text                                null     default null,
    price           numeric                             not null,
    price_currency  text                                not null,
    expect_quantity boolean                             not null,
    section         text                                null     default null,
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp

);

create table forms
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    name           text                                not null,
    description    text                                null     default null,
    definition     jsonb                               not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp

);

create table services
(
    id                      text primary key,
    tenant_id               text references tenants (tenant_id) not null,
    environment_id          text                                not null,
    service_id              text                                not null,
    name                    text                                not null,
    description             text                                not null,
    duration_minutes        integer                             not null,
    price                   numeric                             not null,
    price_currency          text                                not null,
    permitted_add_on_ids    text[]                              not null,
    resource_types_required text[]                              not null,
    requires_time_slot      boolean                             not null,
    created_at              timestamp with time zone            not null default current_timestamp,
    updated_at              timestamp with time zone            not null default current_timestamp
);

create table service_forms
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    s_id           text references services (id),
    form_id        text references forms (id),
    rank           integer,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, s_id, form_id)
);

create table time_slots
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    description     text                                not null,
    start_time_24hr varchar(10)                         not null,
    end_time_24hr   varchar(10)                         not null,
    tag             text                                null     default null,
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp
);

create table pricing_rules
(
    id             text primary key,
    environment_id text                                not null,
    tenant_id      text references tenants (tenant_id) not null,
    definition     jsonb                               not null,
    rank           integer                             not null,
    active         boolean                             not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);

create table tenant_settings
(
    tenant_id        text references tenants (tenant_id) not null primary key,
    environment_id   text                                not null,
    customer_form_id text                                null     default null references forms (id),
    created_at       timestamp with time zone            not null default current_timestamp,
    updated_at       timestamp with time zone            not null default current_timestamp
);

create table customers
(
    id             text primary key                             default uuid_generate_v4(),
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    first_name     text                                not null,
    last_name      text                                not null,
    email          text                                not null check (email ~* '^.+@.+\..+$'),
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);

alter table customers
    add constraint customers_tenant_id_email_key unique (tenant_id, environment_id, email);

create table orders
(
    id                         text primary key                             default uuid_generate_v4(),
    tenant_id                  text references tenants (tenant_id) not null,
    environment_id             text                                not null,
    customer_id                text references customers (id)      not null,
    customer_form_data         jsonb                               null     default null,
    total_price_in_minor_units integer                             not null,
    total_price_currency       text                                not null,
    created_at                 timestamp with time zone            not null default current_timestamp,
    updated_at                 timestamp with time zone            not null default current_timestamp
);

create table order_lines
(
    id                text primary key                             default uuid_generate_v4(),
    tenant_id         text references tenants (tenant_id) not null,
    environment_id    text                                not null,
    order_id          text                                not null,
    service_id        text                                not null,
    add_on_ids        text[]                              not null default '{}',
    date              text                                not null,
    time_slot_id      text                                null     default null references time_slots (id),
    start_time_24hr   varchar(10)                         not null,
    end_time_24hr     varchar(10)                         not null,
    service_form_data jsonb                               null     default null,
    created_at        timestamp with time zone            not null default current_timestamp,
    updated_at        timestamp with time zone            not null default current_timestamp
);

create table bookings
(
    id              text primary key                             default uuid_generate_v4(),
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    customer_id     text references customers (id)      not null,
    service_id      text references services (id)       not null,
    order_id        text references orders (id)         not null,
    date            text                                not null,
    start_time_24hr text                                not null,
    end_time_24hr   text                                not null,
    time_slot_id    text                                null     default null references time_slots (id),
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp
);

create table coupons
(
    id             text primary key                             default uuid_generate_v4(),
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    code           text                                not null,
    definition     jsonb                               not null,
    start_date     text                                not null,
    end_date       text                                null     default null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);

create table reservations
(
    id               text primary key                       default uuid_generate_v4(),
    booking_id       text references bookings (id) not null,
    reservation_time timestamp                     not null,
    expiry_time      timestamp                     not null,
    reservation_type text                          not null,
    created_at       timestamp with time zone      not null default current_timestamp,
    updated_at       timestamp with time zone      not null default current_timestamp
);

create table order_payments
(
    id                      text primary key                             default uuid_generate_v4(),
    tenant_id               text references tenants (tenant_id) not null,
    environment_id          text                                not null,
    order_id                text references orders (id)         not null,
    status                  text                                not null,
    amount_in_minor_units   integer                             not null,
    amount_currency         text                                not null,
    provider                text                                not null,
    provider_transaction_id text                                not null,
    created_at              timestamp with time zone            not null default current_timestamp,
    updated_at              timestamp with time zone            not null default current_timestamp
);

create table system_config
(
    environment_id text not null,
    config_key     text not null,
    config_value   text not null,
    primary key (environment_id, config_key)
);

create table received_webhooks
(
    id             text primary key                             default uuid_generate_v4(),
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    webhook_id     text                                not null,
    payload        jsonb                               not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);

create or replace function call_received_webhook_handler()
    returns trigger as
$$
declare
    v_url        text;
    v_auth_token text;
    v_payload    jsonb;
    v_headers    jsonb;
begin
    select into v_url config_value
    from system_config
    where config_key = 'received_webhook_handler_url'
      and environment_id = new.environment_id;

    select into v_auth_token decrypted_secret
    from vault.decrypted_secrets
    where name = new.environment_id || ':internal_bb_api_key';

    -- construct the json payload with webhook_id and payload
    v_payload := jsonb_build_object(
            'webhook_id', new.webhook_id,
            'payload', new.payload
                 );
    v_headers = jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', v_auth_token
                );

    -- check if url and auth token are not null
    if v_url is not null and v_auth_token is not null then
        -- call the endpoint with pg_net
        perform net.http_post(
                v_url,
                v_payload,
                '{}'::jsonb,
                v_headers
                );
    else
        raise exception 'Url or Auth token is missing in system_config for environment %', new.environment_id;
    end if;

    return new;
end;
$$ language plpgsql;

-- trigger on received_webhooks table
create trigger trigger_received_webhook
    after insert
    on received_webhooks
    for each row
execute function call_received_webhook_handler();