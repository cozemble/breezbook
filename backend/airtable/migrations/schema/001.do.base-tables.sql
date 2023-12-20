create table tenants
(
    tenant_id text primary key,
    name      text
);

create table business_hours
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id),
    day_of_week     varchar(10),
    start_time_24hr varchar(10),
    end_time_24hr   varchar(10)
);

create table blocked_time
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id),
    start_timestamp timestamp with time zone,
    end_timestamp   timestamp with time zone
);

create table resource_types
(
    id        text primary key,
    tenant_id text references tenants (tenant_id),
    name      text
);

create table resources
(
    id            text primary key,
    tenant_id     text references tenants (tenant_id),
    resource_type text references resource_types (id),
    name          text
);

create table resource_availability
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id),
    resource_id     text references resources (id),
    day_of_week     varchar(10),
    start_time_24hr varchar(10),
    end_time_24hr   varchar(10)
);

create table resource_blocked_time
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id),
    resource_id     text references resources (id),
    start_timestamp timestamp with time zone,
    end_timestamp   timestamp with time zone
);

create table add_on
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id),
    name            text,
    price           numeric,
    price_currency  text,
    expect_quantity boolean,
    section         text null default null
);

create table services
(
    id                      text primary key,
    tenant_id               text references tenants (tenant_id),
    service_id              text,
    name                    text,
    description             text,
    duration_minutes        integer,
    price                   numeric,
    price_currency          text,
    permitted_add_on_ids    text[],
    resource_types_required text[]
);



create table time_slots
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id),
    description     text,
    start_time_24hr varchar(10),
    end_time_24hr   varchar(10),
    tag             text null default null
);

create table pricing_rules
(
    tenant_id  text references tenants (tenant_id),
    definition jsonb
);

create table customers
(
    id            text primary key,
    tenant_id     text references tenants (tenant_id),
    name          text,
    email         text,
    extra_details jsonb
);

create table bookings
(
    id              text primary key,
    tenant_id       text references tenants (tenant_id),
    customer_id     text references customers (id),
    service_id      text references services (id),
    date            text,
    start_time_24hr text,
    end_time_24hr   text,
    definition      jsonb
)