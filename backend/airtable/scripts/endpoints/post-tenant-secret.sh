#!/usr/bin/env bash

echo "Please enter your tenant id:"
read tenant_id

echo "Please enter the environment id:"
read environment_id

echo "Please enter your secret:"
read secret

echo "Please enter the secret short name:"
read secret_short_name

echo "Please enter the api key"
read api_key

body=$(cat <<EOF
{
  "_type": "secret.value.specification",
  "secretValue": "$secret",
  "uniqueSecretName": "$secret_short_name",
  "secretDescription": "$secret_short_name"
}
EOF)

curl -s -X POST "https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/internal/api/${environment_id}/${tenant_id}/secret" \
  -H "Content-Type: application/json" \
  -H "Authorization: ${api_key}" \
  -d "$body"