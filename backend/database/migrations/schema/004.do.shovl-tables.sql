create table last_shovl_out
(
    environment_id text                                not null,
    entity_type    text                                not null,
    last_shovl_out timestamp                           not null,
    primary key (environment_id, entity_type)
);

create table customer_form_values
(
    tenant_id      text references tenants (tenant_id) not null,
    environment_id text                                not null,
    customer_id    text references customers (id)      not null,
    form_values    jsonb                               not null,
    primary key (tenant_id, environment_id, customer_id)
);

create table booking_service_form_values
(
    tenant_id           text references tenants (tenant_id) not null,
    environment_id      text                                not null,
    booking_id          text references bookings (id)       not null,
    service_form_id     text references forms (id)          not null,
    service_form_values jsonb                               not null,
    primary key (tenant_id, environment_id, booking_id, service_form_id)
);