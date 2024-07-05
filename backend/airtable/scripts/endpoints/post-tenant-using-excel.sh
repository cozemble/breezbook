#!/usr/bin/env bash
# Check if a command line argument was provided
if [ -z "$1" ]; then
  # If no argument was provided, prompt the user to enter the path
  echo "Please enter the path to the excel file:"
  read path_to_excel
else
  # If an argument was provided, use it as the path
  path_to_excel="$1"
fi

echo "Please enter the environment (dev/prod)"
read environment

echo "Please enter the api key"
read api_key

# the endpoint root is http://localhost:3000 if the environment is dev, otherwise it is https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app
endpoint_root="http://localhost:3000"
if [ "$environment" == "prod" ]; then
  endpoint_root="https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app"
fi

# Assumption: The backend expects the file with the parameter name 'file'
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${endpoint_root}/internal/api/dev/loadTenantFromExcel" \
  -H "Authorization: ${api_key}" \
  -F "file=@${path_to_excel}")

echo "Response status code: $response"

if [ "$response" -ge 200 ] && [ "$response" -lt 300 ]; then
  curl -s -X POST "${endpoint_root}/internal/api/prod/loadTenantFromExcel" \
    -H "Authorization: ${api_key}" \
    -F "file=@${path_to_excel}"
else
  echo "First API call failed with status code: $response"
fi
