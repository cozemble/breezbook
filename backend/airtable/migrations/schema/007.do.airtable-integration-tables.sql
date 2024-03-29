create table oauth_tokens
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    owning_system  text                                not null,
    token_type     text                                not null,
    token          text                                not null,
    expires_at     timestamp                           not null,
    created_at     timestamp                           not null default now(),
    updated_at     timestamp                           not null default now(),
    unique (tenant_id, environment_id, owning_system, token_type)
);

create table data_synchronisation_id_mappings
(
    id             text primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    entity_type    text                                not null,
    from_system    text                                not null,
    to_system      text                                not null,
    from_id        text                                not null,
    to_id          text                                not null,
    created_at     timestamp                           not null default now(),
    updated_at     timestamp                           not null default now(),
    unique (tenant_id, environment_id, entity_type, from_system, to_system, from_id)
);
