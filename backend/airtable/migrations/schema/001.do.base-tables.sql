create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists pg_net;
create extension if not exists pg_cron;

create table languages
(
    id          text primary key,
    name        text                     not null,
    language_id text                     not null,
    created_at  timestamp with time zone not null default current_timestamp,
    updated_at  timestamp with time zone not null default current_timestamp,
    unique (language_id)
);

insert into languages (id, name, language_id)
values ('en', 'English', 'en');

insert into languages (id, name, language_id)
values ('tr', 'Turkish', 'tr');

create table tenants
(
    tenant_id           text primary key,
    name                text                                    not null,
    slug                text                                    not null,
    default_language_id text references languages (language_id) not null default 'en',
    created_at          timestamp with time zone                not null default current_timestamp,
    updated_at          timestamp with time zone                not null default current_timestamp,
    unique (slug)
);

create table locations
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    slug           text                                not null,
    name           text                                not null,
    iana_timezone  text                                not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    unique (tenant_id, environment_id, slug)
);

create unique index locations_tenant_environment_slug_idx on locations (tenant_id, environment_id, slug);

create table business_hours
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    location_id     text references locations (id),
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
    location_id     text references locations (id),
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
    updated_at     timestamp with time zone            not null default current_timestamp,
    unique (tenant_id, environment_id, name)
);

create table resources
(
    id               text primary key,
    tenant_id        text references tenants (tenant_id) not null,
    environment_id   text                                not null,
    resource_type_id text references resource_types (id) not null,
    name             text                                not null,
    metadata         jsonb                               not null default '{}',
    created_at       timestamp with time zone            not null default current_timestamp,
    updated_at       timestamp with time zone            not null default current_timestamp
);

create table resource_availability
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id),
    environment_id  text                           not null,
    resource_id     text references resources (id) not null,
    location_id     text references locations (id),
    day_of_week     varchar(10)                    not null,
    start_time_24hr varchar(10)                    not null,
    end_time_24hr   varchar(10)                    not null,
    created_at      timestamp with time zone       not null default current_timestamp,
    updated_at      timestamp with time zone       not null default current_timestamp
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
    price           numeric                             not null,
    price_currency  text                                not null,
    expect_quantity boolean                             not null,
    section         text                                null     default null,
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp
);

create table add_on_labels
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    add_on_id      text references add_on (id)         not null,
    language_id    text references languages (id)      not null,
    name           text                                not null,
    description    text                                null     default null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id, add_on_id, language_id)
);

create table add_on_images
(
    add_on_id        text references add_on (id) on delete cascade         not null,
    tenant_id        text references tenants (tenant_id) on delete cascade not null,
    environment_id   text                                                  not null,
    public_image_url text                                                  not null,
    mime_type        text                                                  not null,
    context          text                                                  not null,
    created_at       timestamp                                             not null default current_timestamp,
    updated_at       timestamp                                             not null default current_timestamp,
    primary key (add_on_id, tenant_id, environment_id, context)
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

create table form_labels
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    form_id        text references forms (id)          not null,
    language_id    text references languages (id)      not null,
    labels         jsonb                               not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id, form_id, language_id)
);

create table time_slots
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    location_id     text references locations (id),
    description     text                                not null,
    start_time_24hr varchar(10)                         not null,
    end_time_24hr   varchar(10)                         not null,
    tag             text                                null     default null,
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp
);

create table services
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    slug           text                                not null,
    capacity       integer                             not null default 1,
    start_date     timestamp with time zone            not null default current_timestamp,
    end_date       timestamp with time zone            null     default null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    unique (tenant_id, environment_id, slug)
);

create table service_schedule_config
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    service_id      text references services (id)       not null,
    location_id     text references locations (id)      null     default null,
    schedule_config jsonb                               not null,
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp,
    unique (tenant_id, environment_id, service_id, location_id)
);

create table service_add_ons
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    service_id     text references services (id)       not null,
    add_on_id      text references add_on (id)         not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id, service_id, add_on_id)
);

create table service_options
(
    id                text primary key,
    tenant_id         text references tenants (tenant_id) not null,
    environment_id    text                                not null,
    price             numeric                             not null,
    price_currency    text                                not null,
    requires_quantity boolean                             not null,
    service_impacts   jsonb                               not null,
    duration_minutes  integer                             not null,
    created_at        timestamp with time zone            not null default current_timestamp,
    updated_at        timestamp with time zone            not null default current_timestamp
);

create table service_option_labels
(
    tenant_id         text references tenants (tenant_id)  not null,
    environment_id    text                                 not null,
    service_option_id text references service_options (id) not null,
    language_id       text references languages (id)       not null,
    name              text                                 not null,
    description       text                                 not null,
    created_at        timestamp with time zone             not null default current_timestamp,
    updated_at        timestamp with time zone             not null default current_timestamp,
    primary key (tenant_id, environment_id, service_option_id, language_id)
);

create table service_service_options
(
    tenant_id         text references tenants (tenant_id)  not null,
    environment_id    text                                 not null,
    service_id        text references services (id)        not null,
    service_option_id text references service_options (id) not null,
    created_at        timestamp with time zone             not null default current_timestamp,
    updated_at        timestamp with time zone             not null default current_timestamp,
    primary key (tenant_id, environment_id, service_id, service_option_id)
);

create table service_option_images
(
    service_option_id text references service_options (id) on delete cascade not null,
    tenant_id         text references tenants (tenant_id) on delete cascade  not null,
    environment_id    text                                                   not null,
    public_image_url  text                                                   not null,
    mime_type         text                                                   not null,
    context           text                                                   not null,
    created_at        timestamp                                              not null default current_timestamp,
    updated_at        timestamp                                              not null default current_timestamp,
    primary key (tenant_id, environment_id, service_option_id, context)
);

create type resource_requirement_type as enum ('any_suitable', 'specific_resource');

create table service_option_resource_requirements
(
    id                text primary key,
    tenant_id         text references tenants (tenant_id)  not null,
    environment_id    text                                 not null,
    service_option_id text references service_options (id) not null,
    requirement_type  resource_requirement_type            not null,
    resource_id       text references resources (id)       null     default null,
    resource_type_id  text references resource_types (id)  null     default null,
    created_at        timestamp with time zone             not null default current_timestamp,
    updated_at        timestamp with time zone             not null default current_timestamp,
    check ((requirement_type = 'any_suitable' and resource_type_id is not null)
        or (requirement_type = 'specific_resource' and resource_id is not null))
);

create table service_labels
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    service_id     text references services (id)       not null,
    language_id    text references languages (id)      not null,
    name           text                                not null,
    description    text                                not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id, service_id, language_id)
);


create table service_resource_requirements
(
    id               text primary key,
    tenant_id        text references tenants (tenant_id) not null,
    environment_id   text                                not null,
    service_id       text references services (id)       not null,
    requirement_type resource_requirement_type           not null,
    resource_id      text references resources (id)      null     default null,
    resource_type_id text references resource_types (id) null     default null,
    created_at       timestamp with time zone            not null default current_timestamp,
    updated_at       timestamp with time zone            not null default current_timestamp,
    check ((requirement_type = 'any_suitable' and resource_type_id is not null)
        or (requirement_type = 'specific_resource' and resource_id is not null))
);

create table service_locations
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    service_id     text references services (id)       not null,
    location_id    text references locations (id)      not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id, service_id, location_id)
);

create table service_location_prices
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null references tenants (tenant_id),
    environment_id text                                not null,
    service_id     text references services (id)       not null,
    location_id    text references locations (id)      not null references locations (id),
    price          numeric                             not null,
    price_currency text                                not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    unique (tenant_id, environment_id, service_id, location_id, price_currency),
    foreign key (tenant_id, environment_id, service_id, location_id) references service_locations (tenant_id, environment_id, service_id, location_id)
);

create table service_forms
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    service_id     text references services (id)       not null,
    form_id        text references forms (id)          not null,
    rank           integer                             not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id, service_id, form_id)
);

create table service_option_forms
(
    tenant_id         text references tenants (tenant_id)  not null,
    environment_id    text                                 not null,
    service_option_id text references service_options (id) not null,
    form_id           text references forms (id)           not null,
    rank              integer                              not null,
    created_at        timestamp with time zone             not null default current_timestamp,
    updated_at        timestamp with time zone             not null default current_timestamp,
    primary key (tenant_id, environment_id, service_option_id, form_id)
);

create table pricing_rules
(
    id             text primary key,
    environment_id text                                not null,
    tenant_id      text references tenants (tenant_id) not null,
    location_id    text references locations (id),
    definition     jsonb                               not null,
    rank           integer                             not null,
    active         boolean                             not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);

create table tenant_settings
(
    tenant_id        text references tenants (tenant_id) not null,
    environment_id   text                                not null,
    customer_form_id text                                null     default null references forms (id),
    created_at       timestamp with time zone            not null default current_timestamp,
    updated_at       timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id)
);

create table customers
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    first_name     text                                not null,
    last_name      text                                not null,
    email          text                                not null check (email ~* '^.+@.+\..+$'),
    phone_e164     text                                not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    unique (tenant_id, environment_id, email),
    unique (tenant_id, environment_id, phone_e164)
);

alter table customers
    add constraint customers_tenant_id_email_key unique (tenant_id, environment_id, email);

alter table customers
    add constraint customers_tenant_id_phone_key unique (tenant_id, environment_id, phone_e164);

create type payment_method as enum ('upfront', 'on_delivery','deposit_and_balance_on_delivery');

create table orders
(
    id                         text primary key,
    tenant_id                  text references tenants (tenant_id) not null,
    environment_id             text                                not null,
    customer_id                text references customers (id)      not null,
    customer_form_data         jsonb                               null     default null,
    total_price_in_minor_units integer                             not null,
    total_price_currency       text                                not null,
    payment_method             payment_method                      not null,
    created_at                 timestamp with time zone            not null default current_timestamp,
    updated_at                 timestamp with time zone            not null default current_timestamp
);

create table order_lines
(
    id                         text primary key,
    tenant_id                  text references tenants (tenant_id) not null,
    environment_id             text                                not null,
    order_id                   text                                not null,
    service_id                 text references services (id)       not null,
    location_id                text references locations (id)      not null,
    date                       text                                not null,
    start_time_24hr            varchar(10)                         not null,
    end_time_24hr              varchar(10)                         not null,
    service_form_data          jsonb                               null     default null,
    total_price_in_minor_units integer                             not null,
    total_price_currency       text                                not null,
    created_at                 timestamp with time zone            not null default current_timestamp,
    updated_at                 timestamp with time zone            not null default current_timestamp,
    foreign key (tenant_id, environment_id, service_id, location_id, total_price_currency) references service_location_prices (tenant_id, environment_id, service_id, location_id, price_currency)
);

create table order_line_add_ons
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    order_line_id  text references order_lines (id)    not null,
    add_on_id      text references add_on (id)         not null,
    quantity       integer                             not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id, order_line_id, add_on_id)
);

create table order_line_service_options
(
    tenant_id         text references tenants (tenant_id)  not null,
    environment_id    text                                 not null,
    order_line_id     text references order_lines (id)     not null,
    service_option_id text references service_options (id) not null,
    quantity          integer                              not null,
    created_at        timestamp with time zone             not null default current_timestamp,
    updated_at        timestamp with time zone             not null default current_timestamp,
    primary key (tenant_id, environment_id, order_line_id, service_option_id)
);

create type booking_status as enum ('confirmed', 'cancelled');

create table bookings
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    status          booking_status                      not null default 'confirmed',
    customer_id     text references customers (id)      not null,
    service_id      text references services (id)       not null,
    location_id     text references locations (id)      not null,
    order_id        text references orders (id)         not null,
    order_line_id   text references order_lines (id)    not null,
    date            text                                not null,
    start_time_24hr text                                not null,
    end_time_24hr   text                                not null,
    booked_capacity integer                             not null,
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp
);

create table booking_add_ons
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    booking_id     text references bookings (id)       not null,
    add_on_id      text references add_on (id)         not null,
    quantity       integer                             not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id, booking_id, add_on_id)
);

create table booking_service_options
(
    tenant_id         text references tenants (tenant_id)  not null,
    environment_id    text                                 not null,
    booking_id        text references bookings (id)        not null,
    service_option_id text references service_options (id) not null,
    quantity          integer                              not null,
    created_at        timestamp with time zone             not null default current_timestamp,
    updated_at        timestamp with time zone             not null default current_timestamp,
    primary key (tenant_id, environment_id, booking_id, service_option_id)
);

create table booking_resource_requirements
(
    id               text primary key,
    tenant_id        text references tenants (tenant_id) not null,
    environment_id   text                                not null,
    booking_id       text references bookings (id)       not null,
    requirement_id   text                                not null,
    requirement_type resource_requirement_type           not null,
    resource_id      text references resources (id)      null     default null,
    resource_type    text references resource_types (id) null     default null,
    created_at       timestamp with time zone            not null default current_timestamp,
    updated_at       timestamp with time zone            not null default current_timestamp,
    check ((requirement_type = 'any_suitable' and resource_type is not null)
        or (requirement_type = 'specific_resource' and resource_id is not null))
);

create type booking_event_type as enum ('cancelled', 'amended', 'completed', 'no_show');

create table booking_events
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    booking_id     text references bookings (id)       not null,
    event_type     booking_event_type                  not null,
    event_data     jsonb                               not null,
    created_at     timestamp with time zone            not null default current_timestamp
);

create table coupons
(
    id             text primary key,
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
    id               text primary key,
    tenant_id        text references tenants (tenant_id) not null,
    environment_id   text                                not null,
    booking_id       text references bookings (id)       not null,
    reservation_time timestamp                           not null,
    expiry_time      timestamp                           not null,
    reservation_type text                                not null,
    created_at       timestamp with time zone            not null default current_timestamp,
    updated_at       timestamp with time zone            not null default current_timestamp
);

create type payment_status as enum ('succeeded', 'pending', 'failed'); -- add any other statuses you have

create table order_payments
(
    id                      text primary key,
    tenant_id               text references tenants (tenant_id) not null,
    environment_id          text                                not null,
    order_id                text references orders (id)         not null,
    status                  payment_status                      not null,
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
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    webhook_id     text                                not null,
    payload        jsonb                               not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);

create table refund_rules
(
    id             text primary key,
    environment_id text                                not null,
    tenant_id      text references tenants (tenant_id) not null,
    location_id    text references locations (id),
    definition     jsonb                               not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);

create table cancellation_grants
(
    id             text primary key,
    environment_id text                                not null,
    tenant_id      text references tenants (tenant_id) not null,
    booking_id     text references bookings (id)       not null,
    definition     jsonb                               not null,
    committed      boolean                             not null default false,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp
);
