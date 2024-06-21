#!/usr/bin/env bash

echo "Please enter the test stripe secret:"
read stripe_secret

echo "Please enter the test stripe public key:"
read stripe public_key

echo "Please enter the api key"
read api_key

tenant_ids=("breezbook-gym" "thesmartwashltd" "tenant1")
environment_id="dev"

for tenant_id in "${tenant_ids[@]}"
do
  # Post the stripe secret key
body=$(cat <<EOF
{
  "_type": "secret.value.specification",
  "secretValue": "$stripe_secret",
  "uniqueSecretName": "stripe-api-key",
  "secretDescription": "stripe-api-key"
}
EOF)

echo "$body"

  curl -s -X POST "http://localhost:3000/internal/api/${environment_id}/${tenant_id}/secret" \
    -H "Content-Type: application/json" \
    -H "Authorization: ${api_key}" \
    -d "$body"

    # Post the stripe public key
body=$(cat <<EOF
{
"_type": "secret.value.specification",
"secretValue": "$stripe_public_key",
"uniqueSecretName": "stripe-public-key",
"secretDescription": "stripe-public-key"
}
EOF)

  curl -s -X POST "http://localhost:3000/internal/api/${environment_id}/${tenant_id}/secret" \
    -H "Content-Type: application/json" \
    -H "Authorization: ${api_key}" \
    -d "$body"

    echo "Secrets posted successfully for tenant: $tenant_id"
done