#!/usr/bin/env bash

docker run -itd -e POSTGRES_USER=user -e POSTGRES_PASSWORD=password -p 127.0.0.1:5432:5432 -v /tmp/docker-postgres-data:/var/lib/postgresql/data --name postgresql postgres:15.1
