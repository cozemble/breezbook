create table prospects
(
    id            text primary key,
    email         text                     not null,
    signup_method text                     not null,
    created_at    timestamp with time zone not null default current_timestamp,
    updated_at    timestamp with time zone not null default current_timestamp
);