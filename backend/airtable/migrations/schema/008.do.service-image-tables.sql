create table service_images (
    service_id text references services(id) on delete cascade not null,
    tenant_id text references tenants(tenant_id) on delete cascade not null,
    environment_id text not null,
    public_image_url text not null,
    mime_type text not null,
    context text not null,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    primary key (service_id, tenant_id, environment_id, context)
)