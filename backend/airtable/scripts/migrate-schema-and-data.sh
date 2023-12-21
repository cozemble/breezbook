#!/usr/bin/env bash

# get the port as the first argument, or default to 5432
PORT=${1:-5432}

echo "Migrating schema and data to port $PORT"

cat migrations/schema/postgratorrc.json | sed "s/\"port\": 5432/\"port\": $PORT/" > /tmp/schema-postgratorrc.json
npx postgrator --config=/tmp/schema-postgratorrc.json

cat migrations/data/carwash/postgratorrc.json | sed "s/\"port\": 5432/\"port\": $PORT/" > /tmp/data-postgratorrc.json
npx postgrator --config=/tmp/data-postgratorrc.json