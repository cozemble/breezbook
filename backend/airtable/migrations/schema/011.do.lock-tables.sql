create table locks
(
    lock_key    varchar(255) primary key,
    acquired_at timestamp default current_timestamp
);