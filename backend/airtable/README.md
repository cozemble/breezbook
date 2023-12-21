## Getting the API running locally

1. `./buildDocker.sh`
2. `docker-compose up`
3. `./scripts/migrate-schema-and-data.sh 5434`
4. `curl -X POST "http://localhost:3000/api/tenant1/service/smallCarWash/availability?fromDate=2023-12-20&toDate=2023-12-23" -H "Accept: application/json"`