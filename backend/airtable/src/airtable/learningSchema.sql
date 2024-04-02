create table customers
(
    customer_id  int primary key,
    first_name   varchar(255),
    last_name    varchar(255),
    email        varchar(255),
    phone_number varchar(255),
);

create table services
(
    service_id   int primary key,
    service_name varchar(255),
    price        decimal(10, 2)
);

create table bookings
(
    booking_id  int primary key,
    customer_id int references customers (customer_id),
    service_id  int references services (service_id),
    date        date,
    time        time
);

create table booking_details
(
    booking_id int references bookings (booking_id),
    make       varchar(255),
    model      varchar(255),
    year       int,
    colour     varchar(255)
);
-- I do care about the airtable record id for this table, because it can be updated for a booking

-- so breez booking has its own id, and can map to airtable booking with an airtable record id
-- but it must also create an airtable booking_details with its own airtable record id
-- then and breez booking_service_form has its own id, but also the booking id, and it must augment the airtable booking_details

-- booking_id => ('bookings', 'rec1234'), ('booking_details', 'rec234234', fk('booking_id', 'bookings', 'rec1234'))
-- booking_details_id => ('booking_details', 'rec234234')
-- booking_service_form_id => ('booking_details', 'rec234234')

