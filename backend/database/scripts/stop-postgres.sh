#!/usr/bin/env bash

docker-compose -f ../supabase/supabase-min-docker-compose.yml --env-file ../supabase/local-supabase.env down
#docker stop postgresql
#docker rm postgresql