#!/usr/bin/env bash

# Check if a command line argument was provided
if [ -z "$1" ]
then
  # If no argument was provided, prompt the user to enter the path
  echo "Please enter the path to the excel file:"
  read path_to_excel
else
  # If an argument was provided, use it as the path
  path_to_excel="$1"
fi

echo "Please enter the api key"
read api_key

# Assumption: The backend expects the file with the parameter name 'file'
curl -s -X POST "http://localhost:3000/internal/api/loadTenantFromExcel" \
  -H "Authorization: ${api_key}" \
  -F "file=@${path_to_excel}"
