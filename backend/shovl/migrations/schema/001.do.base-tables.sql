create table oauth_tokens (
    tenant_id text not null,
    environment_id text not null,
    owning_system text not null,
    token_type text not null,
    token text not null,
    expires_at timestamp not null,
    created_at timestamp not null,
    updated_at timestamp not null,
    primary key (tenant_id, environment_id, owning_system, token_type)
);