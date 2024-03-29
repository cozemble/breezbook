
curl -H "Content-Type: application/json" \
-H "Authorization: test-api-key" \
-d "{
  \"_type\": \"secret.value.specification\",
  \"secretValue\": \"$TEST_STRIPE_PUBLIC_KEY\",
  \"uniqueSecretName\": \"stripe-public-key\",
  \"secretDescription\": \"stripe-public-key\"
}" \
http://localhost:3000/internal/api/dev/tenant1/secret

echo "Set stripe public key to $TEST_STRIPE_PUBLIC_KEY"

curl -H "Content-Type: application/json" \
-H "Authorization: test-api-key" \
-d "{
  \"_type\": \"secret.value.specification\",
  \"secretValue\": \"$TEST_STRIPE_SECRET_KEY\",
  \"uniqueSecretName\": \"stripe-api-key\",
  \"secretDescription\": \"stripe-api-key\"
}" \
http://localhost:3000/internal/api/dev/tenant1/secret

echo "Set stripe secret key to $TEST_STRIPE_SECRET_KEY"
