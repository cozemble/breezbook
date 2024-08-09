create table packages
(
    id                    text primary key,
    tenant_id             text references tenants (tenant_id) not null,
    environment_id        text                                not null,
    slug                  text                                not null,
    definition            jsonb                               not null,
    validity_period_type  text                                not null,
    validity_period_value integer                             not null,
    created_at            timestamp with time zone            not null default current_timestamp,
    updated_at            timestamp with time zone            not null default current_timestamp,
    unique (tenant_id, environment_id, slug)
);

create table package_locations
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    package_id     text references packages (id)       not null,
    location_id    text references locations (id)      not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id, package_id, location_id)
);

create table package_labels
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    package_id     text references packages (id)       not null,
    language_id    text references languages (id)      not null,
    name           text                                not null,
    description    text                                not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    primary key (tenant_id, environment_id, package_id, language_id)
);

create table package_location_prices
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    package_id     text references packages (id)       not null,
    location_id    text references locations (id)      not null,
    price          numeric                             not null,
    price_currency text                                not null,
    created_at     timestamp with time zone            not null default current_timestamp,
    updated_at     timestamp with time zone            not null default current_timestamp,
    unique (tenant_id, environment_id, package_id, location_id, price_currency),
    foreign key (tenant_id, environment_id, package_id, location_id) references package_locations (tenant_id, environment_id, package_id, location_id)
);

create table package_images
(
    package_id       text references packages (id) on delete cascade       not null,
    tenant_id        text references tenants (tenant_id) on delete cascade not null,
    environment_id   text                                                  not null,
    public_image_url text                                                  not null,
    mime_type        text                                                  not null,
    context          text                                                  not null,
    created_at       timestamp                                             not null default current_timestamp,
    updated_at       timestamp                                             not null default current_timestamp,
    primary key (package_id, tenant_id, environment_id, context)
)