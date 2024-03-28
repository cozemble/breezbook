create table last_change_announcements (
    id serial primary key,
    environment_id integer not null,
    announcement_date timestamp not null
);
