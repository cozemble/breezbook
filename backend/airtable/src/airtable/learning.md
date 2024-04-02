This is a create booking event:

```
{
  "data": {
    "id": "c960d68c-931a-4474-aa90-b0df8dcb231c",
    "date": "2024-03-29",
    "order_id": "5311f363-cdac-48f5-b802-630f5cc08be7",
    "tenant_id": "tenant1",
    "service_id": "smallCarWash",
    "customer_id": "38cb9a99-787f-4167-b9d7-c363351b6ad1",
    "time_slot_id": "timeSlot#1",
    "end_time_24hr": "13:00",
    "environment_id": "dev",
    "start_time_24hr": "09:00",
    "add-ons": ["add-on#1", "add-on#2"],
  },
  "_type": "create",
  "entity": "bookings",
  "entityId": {
    "_type": "id",
    "value": "c960d68c-931a-4474-aa90-b0df8dcb231c"
  }
}
```

It should yield:

1. airtable_create("bookings") => rec100
2. airtable_create("booking_details") => rec101 (booking_id, service_id and add-ons)

And breezbook id repository should be updated with:

| breezbook_entity | breezbook_id                            | airtable_entity | airtable_id |
|------------------|-----------------------------------------|-----------------|-------------|
| bookings         | id=c960d68c-931a-4474-aa90-b0df8dcb231c | Bookings        | rec100      |
| bookings         | id=c960d68c-931a-4474-aa90-b0df8dcb231c | Booking details | rec101      |

This is an upsert booking_service_form_values event:

```
{
  "_type": "upsert",
  "create": {
    "data": {
      "tenant_id": "tenant1",
      "booking_id": "c960d68c-931a-4474-aa90-b0df8dcb231c",
      "environment_id": "dev",
      "service_form_id": "car-details-form",
      "service_form_values": {
        "make": "Honda",
        "year": 8765,
        "model": "Accord",
        "colour": "Silver"
      }
    },
    "_type": "create",
    "entity": "booking_service_form_values",
    "entityId": {
      "_type": "id",
      "value": "c960d68c-931a-4474-aa90-b0df8dcb231c"
    }
  },
  "update": {
    "data": {
      "service_form_values": {
        "make": "Honda",
        "year": 8765,
        "model": "Accord",
        "colour": "Silver"
      }
    },
    "_type": "update",
    "where": {
      "tenant_id_environment_id_booking_id_service_form_id": {
        "tenant_id": "tenant1",
        "booking_id": "c960d68c-931a-4474-aa90-b0df8dcb231c",
        "environment_id": "dev",
        "service_form_id": "car-details-form"
      }
    },
    "entity": "booking_service_form_values",
    "entityId": {
      "_type": "id",
      "value": "c960d68c-931a-4474-aa90-b0df8dcb231c"
    }
  }
}
```

It should yield:

1. airtable_create("car_details") => rec102 - setting the
2. airtable_create("booking_service_form_values") => rec102

And breezbook id repository should be updated with:

| breezbook_entity            | breezbook_id                                                                      | airtable_entity | airtable_id |
|-----------------------------|-----------------------------------------------------------------------------------|-----------------|-------------|
| booking_service_form_values | booking_id=c960d68c-931a-4474-aa90-b0df8dcb231c, service_form_id=car-details-form | Car details     | rec102      |