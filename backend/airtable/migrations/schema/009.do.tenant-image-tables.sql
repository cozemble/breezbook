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
    tenant_id      text references tenants (tenant_id) on delete cascade not null,
    environment_id text                                                  not null,
    slug           text                                                  not null,
    theme          jsonb                                                          default '{}'::jsonb,
    created_at     timestamp                                             not null default current_timestamp,
    updated_at     timestamp                                             not null default current_timestamp,
    primary key (tenant_id, environment_id),
    unique (environment_id, slug)
);