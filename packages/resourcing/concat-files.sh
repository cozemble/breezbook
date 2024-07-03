#!/bin/bash

find . -type f -name "*.ts" | while read -r file; do
    echo "File: $file"
    echo "Contents:"
    cat "$file"
    echo "----------------------------------------"
done