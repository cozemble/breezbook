#!/usr/bin/env bash

cat .env-docker-compose | sed "s/PGHOST=db/PGHOST=127.0.0.1/" > /tmp/.env-docker-compose.tmp
npx dotenv -e /tmp/.env-docker-compose.tmp -- bash -c 'npx postgrator --config=migrations/schema/postgratorrc.json'
npx dotenv -e /tmp/.env-docker-compose.tmp -- bash -c 'npx postgrator --config=migrations/data/carwash/postgratorrc.json'

