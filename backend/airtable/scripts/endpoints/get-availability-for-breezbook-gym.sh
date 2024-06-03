#!/usr/bin/env bash

JSON=$(curl -s -X POST "http://localhost:3000/api/dev/breezbook-gym/breezbook-gym_dev_europe.uk.harlow/service/breezbook-gym_dev_pt.service.1hr/availability?fromDate=2024-06-03&toDate=2024-06-10")
echo $JSON
echo $JSON | jq