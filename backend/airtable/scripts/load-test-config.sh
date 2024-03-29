
psql  -c "select vault.create_secret('$TEST_STRIPE_PUBLIC_KEY', 'tenant1:dev:stripe-public-key', 'stripe-public-key');"
psql  -c "select vault.create_secret('$TEST_STRIPE_SECRET_KEY', 'tenant1:dev:stripe-api-key', 'stripe-api-key');"
psql  -c "insert into oauth_tokens(id, tenant_id, environment_id, owning_system, token_type, token, expires_at)
          values ('1', 'tenant1', 'dev', 'airtable', 'refresh', '$TEST_AIRTABLE_REFRESH_TOKEN', '2025-03-29T12:47:27.105Z');"

