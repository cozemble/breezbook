create table last_change_announcements
(
    id                serial primary key,
    environment_id    text      not null,
    announcement_date timestamp not null
);
