create table booking_payments
(
    id                      text primary key,
    tenant_id               text references tenants (tenant_id) on delete cascade not null,
    environment_id          text                                                  not null,
    booking_id              text references bookings (id) on delete cascade       not null,
    status                  payment_status                                        not null,
    amount_in_minor_units   integer                                               not null,
    amount_currency         text                                                  not null,
    provider                text                                                  not null,
    provider_transaction_id text                                                  not null,
    created_at              timestamp with time zone                              not null default current_timestamp,
    updated_at              timestamp with time zone                              not null default current_timestamp
);