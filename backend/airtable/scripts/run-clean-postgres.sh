#!/usr/bin/env bash
./scripts/stop-postgres.sh
./scripts/rmDataFile.sh
./scripts/run-postgres.sh
docker logs -f postgresql >/tmp/postgresql.log &
tail -f /tmp/postgresql.log | sed '/server started/ q'
echo "Attempting to connect to Postgres..."
until PGPASSWORD=password psql -h localhost -U user -d postgres -c '\q'; do # replace with your credentials
  echo "Postgres is unavailable - sleeping"
  sleep 1
done

echo "Postgres is up."
