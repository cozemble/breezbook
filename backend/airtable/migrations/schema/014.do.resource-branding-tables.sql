create table resource_images
(
    resource_id      text references resources (id) on delete cascade      not null,
    tenant_id        text references tenants (tenant_id) on delete cascade not null,
    environment_id   text                                                  not null,
    public_image_url text                                                  not null,
    mime_type        text                                                  not null,
    context          text                                                  not null,
    created_at       timestamp                                             not null default current_timestamp,
    updated_at       timestamp                                             not null default current_timestamp,
    primary key (resource_id, context)
);

create table resource_markup
(
    id             text primary key,
    resource_id    text references resources (id) on delete cascade      not null,
    tenant_id      text references tenants (tenant_id) on delete cascade not null,
    environment_id text                                                  not null,
    markup_type    text                                                  not null,
    context        text                                                  not null,
    created_at     timestamp                                             not null default current_timestamp,
    updated_at     timestamp                                             not null default current_timestamp,
    unique (resource_id, context)
);

create table resource_markup_labels
(
    tenant_id          text references tenants (tenant_id) on delete cascade not null,
    environment_id     text                                                  not null,
    language_id        text references languages (id)                        not null,
    resource_markup_id text references resource_markup (id)                  not null,
    markup             text                                                  not null,
    created_at         timestamp                                             not null default current_timestamp,
    updated_at         timestamp                                             not null default current_timestamp,
    primary key (resource_markup_id, language_id)
);
