#!/bin/bash

directories=("types" "core" "resourcing" "pricing" )

for dir in ${directories[@]}; do
    find "$dir" -type f -name "*.ts" | while read -r file; do
        echo "File: $file"
        echo "Contents:"
        cat "$file"
        echo "----------------------------------------"
    done
done