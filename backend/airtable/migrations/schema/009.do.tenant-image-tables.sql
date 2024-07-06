create table tenant_images
(
    tenant_id        text references tenants (tenant_id) on delete cascade not null,
    environment_id   text                                                  not null,
    public_image_url text                                                  not null,
    mime_type        text                                                  not null,
    context          text                                                  not null,
    created_at       timestamp                                             not null default current_timestamp,
    updated_at       timestamp                                             not null default current_timestamp,
    primary key (tenant_id, environment_id, context)
);

create table tenant_branding
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) on delete cascade not null,
    environment_id text                                                  not null,
    theme          jsonb                                                          default '{}'::jsonb,
    created_at     timestamp                                             not null default current_timestamp,
    updated_at     timestamp                                             not null default current_timestamp,
    unique (tenant_id, environment_id)
);

create table tenant_branding_labels
(
    tenant_id          text references tenants (tenant_id)  not null,
    environment_id     text                                 not null,
    language_id        text references languages (id)       not null,
    tenant_branding_id text references tenant_branding (id) not null,
    headline           text                                 not null,
    description        text                                 not null,
    created_at         timestamp with time zone             not null default current_timestamp,
    updated_at         timestamp with time zone             not null default current_timestamp,
    primary key (tenant_id, environment_id, language_id)
);
