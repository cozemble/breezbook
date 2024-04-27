#!/usr/bin/env bash

JSON=$(curl -s -X GET https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/api/dev/tenants?slug=tenant1)
echo $JSON | jq