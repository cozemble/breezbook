create table mutation_events
(
    id             serial primary key,
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    event_type     varchar(255)                        not null,
    entity_type    varchar(255)                        not null,
    entity_id      text                                not null,
    event_time     timestamp default now()             not null,
    event_data     jsonb                               not null
);
