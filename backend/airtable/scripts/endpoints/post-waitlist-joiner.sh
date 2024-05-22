#!/usr/bin/env bash

echo "Please enter the email address you want to register:"
read email_address

body=$(cat <<EOF
{
  "_type": "waitlist.registration",
  "email": "$email_address"
}
EOF)

curl -s -X POST "https://breezbook-backend-airtable-qwquwvrytq-nw.a.run.app/api/signup/waitlist" \
  -H "Content-Type: application/json" \
  -d "$body"