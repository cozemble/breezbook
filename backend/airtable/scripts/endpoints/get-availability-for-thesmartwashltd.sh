#!/usr/bin/env bash

JSON=$(curl -s -X POST "https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/api/dev/thesmartwashltd/thesmartwashltd_dev_location_europe.uk.london/service/thesmartwashltd_dev_service_mini.valet.large.car/availability?fromDate=2024-02-01&toDate=2024-02-07")
echo $JSON | jq