create extension if not exists "uuid-ossp";

create table tenants
(
    tenant_id text primary key,
    name      text not null
);

create table business_hours
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    day_of_week     varchar(10)                         not null,
    start_time_24hr varchar(10)                         not null,
    end_time_24hr   varchar(10)                         not null
);

create table blocked_time
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    date            text                                not null,
    start_time_24hr text                                not null,
    end_time_24hr   text                                not null
);

create table resource_types
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    name           text                                not null
);

create table resources
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    resource_type  text references resource_types (id) not null,
    name           text                                not null
);

create table resource_availability
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id),
    environment_id  text        not null,
    resource_id     text references resources (id),
    day_of_week     varchar(10) not null,
    start_time_24hr varchar(10) not null,
    end_time_24hr   varchar(10) not null
);

create table resource_blocked_time
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    resource_id     text references resources (id)      not null,
    date            text                                not null,
    start_time_24hr text                                not null,
    end_time_24hr   text                                not null
);

create table add_on
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    name            text                                not null,
    price           numeric                             not null,
    price_currency  text                                not null,
    expect_quantity boolean                             not null,
    section         text                                null default null
);

create table forms
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    name           text                                not null,
    description    text                                null default null,
    definition     jsonb                               not null
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
    requires_time_slot      boolean                             not null
);

create table service_forms
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    s_id           text references services (id),
    form_id        text references forms (id),
    rank           integer,
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
    tag             text                                null default null
);

create table pricing_rules
(
    id             text primary key,
    environment_id text                                not null,
    tenant_id      text references tenants (tenant_id) not null,
    definition     jsonb                               not null,
    rank           integer                             not null,
    active         boolean                             not null
);

create table tenant_settings
(
    tenant_id        text references tenants (tenant_id) not null primary key,
    environment_id   text                                not null,
    customer_form_id text                                null default null references forms (id)
);

create table customers
(
    id             text primary key default uuid_generate_v4(),
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    first_name     text                                not null,
    last_name      text                                not null,
    email          text                                not null check (email ~* '^.+@.+\..+$')
);

alter table customers
    add constraint customers_tenant_id_email_key unique (tenant_id, environment_id, email);

create table orders
(
    id                 text primary key                         default uuid_generate_v4(),
    tenant_id          text references tenants (tenant_id) not null,
    environment_id     text                                not null,
    customer_id        text references customers (id)      not null,
    customer_form_data jsonb                               null default null
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
    service_form_data jsonb                               null     default null
);

create table bookings
(
    id              text primary key                         default uuid_generate_v4(),
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    customer_id     text references customers (id)      not null,
    service_id      text references services (id)       not null,
    order_id        text references orders (id)         not null,
    date            text                                not null,
    start_time_24hr text                                not null,
    end_time_24hr   text                                not null,
    time_slot_id    text                                null default null references time_slots (id)
);

create table coupons
(
    id             text primary key                         default uuid_generate_v4(),
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    code           text                                not null,
    definition     jsonb                               not null,
    start_date     text                                not null,
    end_date       text                                null default null
);

create table reservations
(
    id               text primary key default uuid_generate_v4(),
    booking_id       text references bookings (id) not null,
    reservation_time timestamp                     not null,
    expiry_time      timestamp                     not null,
    reservation_type text                          not null
);