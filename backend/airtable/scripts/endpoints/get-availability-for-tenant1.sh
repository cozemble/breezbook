#!/usr/bin/env bash

JSON=$(curl -s -X POST "https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/api/dev/tenant1/breezbook.carwash.locations.london/service/smallCarWash.id/availability?fromDate=2024-02-01&toDate=2024-02-07")
echo $JSON | jq