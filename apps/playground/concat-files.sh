#!/bin/bash

directories=("src/routes/uxs/dog-walking" "src/lib/uxs/dog-walking")

for dir in "${directories[@]}"; do
    find "$dir" -type f \( -name "*.ts" -o -name "*.svelte" \) | while read -r file; do
        echo "File: $file"
        echo "Contents:"
        cat "$file"
        echo "----------------------------------------"
    done
done