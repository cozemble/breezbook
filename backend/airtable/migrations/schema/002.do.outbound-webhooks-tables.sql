create table system_outbound_webhooks
(
    id             uuid primary key                  default uuid_generate_v4(),
    environment_id text                     not null,
    action         text                     not null,                   -- create, update, delete
    status         text                     not null default 'pending', -- pending, success, failed
    payload_type   text                     not null,
    payload        jsonb                    not null,
    batch_id       uuid                     null     default null,
    created_at     timestamp with time zone not null default current_timestamp,
    updated_at     timestamp with time zone not null default current_timestamp
);

create table webhook_destinations
(
    id              uuid primary key                             default uuid_generate_v4(),
    tenant_id       text references tenants (tenant_id) not null,
    environment_id  text                                not null,
    destination     text                                not null, -- zapier, airtable, etc.,
    destination_url text                                not null, -- url to which the message will be sent
    headers         jsonb,                                        -- used for authorisation or other purposes, may contain placeholders for secret names
    created_at      timestamp with time zone            not null default current_timestamp,
    updated_at      timestamp with time zone            not null default current_timestamp
);

create table payload_actions
(
    id           uuid primary key default uuid_generate_v4(),
    payload_type text not null, -- booking, payment, ...
    action       text not null, -- create, update, delete
    unique (payload_type, action)
);

create table webhook_payload_actions
(
    webhook_id uuid references webhook_destinations (id),
    payload_id uuid references payload_actions (id),
    primary key (webhook_id, payload_id)
);

create table outbound_webhook_messages
(
    id             uuid primary key                  default uuid_generate_v4(),
    environment_id text                     not null,
    message        text                     not null,
    created_at     timestamp with time zone not null default current_timestamp
);

create or replace function notify_outbound_webhooks() returns void as
$$
declare
    batch        uuid;
    count        integer;
    v_url        text;
    v_auth_token text;
    v_payload    jsonb;
    v_headers    jsonb;

    -- For selecting distinct environment_id
    env          text;
    cursor_env   refcursor;
begin
    -- Open a cursor for distinct environment_id's
    open cursor_env for select distinct environment_id
                        from system_outbound_webhooks
                        where status = 'pending'
                          and batch_id is null;

    -- Loop through each environment_id
    loop
        fetch next from cursor_env into env;

        -- No more rows to fetch, exit the loop
        exit when not found;

        batch := uuid_generate_v4();

        -- Update only the rows of the current environment
        update system_outbound_webhooks
        set batch_id   = batch,
            updated_at = current_timestamp
        where status = 'pending'
          and batch_id is null
          and environment_id = env;

        get diagnostics count = row_count;

        if count > 0 then
            select into v_url config_value
            from system_config
            where config_key = 'outbound_webhook_handler_url'
              and environment_id = env;

            select into v_auth_token decrypted_secret
            from vault.decrypted_secrets
            where name = env || ':internal_bb_api_key';

            v_payload := jsonb_build_object('batch_id', batch);
            v_headers = jsonb_build_object('Content-Type', 'application/json', 'Authorization', v_auth_token);

            if v_url is not null and v_auth_token is not null then
                perform net.http_post(v_url, v_payload, '{}'::jsonb, v_headers);
                insert into outbound_webhook_messages (message, environment_id)
                values ('Batch created.  ID ' || batch, env);
            else
                raise exception 'Url or Auth token is missing in system_config for environment %', env;
            end if;
        end if;
    end loop;

    close cursor_env;
end;
$$ language plpgsql;