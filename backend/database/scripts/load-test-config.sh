
psql  -c "select vault.create_secret('$TEST_STRIPE_PUBLIC_KEY', 'tenant1:dev:stripe-public-key', 'stripe-public-key');"
psql  -c "select vault.create_secret('$TEST_STRIPE_SECRET_KEY', 'tenant1:dev:stripe-api-key', 'stripe-api-key');"

