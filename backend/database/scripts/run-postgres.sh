#!/usr/bin/env bash

#docker run -itd -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -p 127.0.0.1:5432:5432 -v /tmp/docker-postgres-data:/var/lib/postgresql/data --name postgresql supabase/postgres:15.1.0.147
docker-compose -f ../supabase/supabase-min-docker-compose.yml --env-file ../supabase/local-supabase.env up -d

