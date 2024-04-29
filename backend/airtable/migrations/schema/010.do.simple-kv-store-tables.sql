create table simple_kv_store
(
    key        text      not null,
    value      text      not null,
    created_at timestamp not null default current_timestamp,
    updated_at timestamp not null default current_timestamp,
    expires_at timestamp null     default null,
    primary key (key)
);

create or replace function delete_expired_s()
    returns void as
$$
begin
    delete from simple_kv_store where expires_at < now();
end;
$$
    language plpgsql;

select cron.schedule('0 * * * *', $$call delete_expired_records()$$);