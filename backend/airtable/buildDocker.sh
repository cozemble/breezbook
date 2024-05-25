#!/usr/bin/env bash

../scripts/packaging/rewrite-workspace-deps.sh
cp Dockerfile .dockerignore staging
cp tsconfig.json build.js staging
cp -r prisma staging
export DOCKER_BUILDKIT=1
docker build --platform linux/amd64 -t airtable-api .
docker tag airtable-api europe-west2-docker.pkg.dev/cozemble/main-docker-repo/breezbook/backend-airtable:latest