#!/usr/bin/env bash

JSON=$(curl -s -X POST "http://localhost:3000/api/dev/thesmartwashltd/thesmartwashltd_dev_location_europe.uk.london/service/thesmartwashltd_dev_service_mini.valet.large.car/availability?fromDate=2024-02-01&toDate=2024-02-07")
# echo the status code
echo $?
echo $JSON | jq