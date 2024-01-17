#!/usr/bin/env bash

if [ -z "$CI" ]; then
    echo "Not running in CI, so running tests in parallel."
    npx vitest run
else
    echo "Running in CI, so running tests one by one to avoid seg faults that I can't figure out how to fix."
    for i in `ls -1 test/*.spec.ts`; do
      echo "Running $i"
      npx vitest run $i
    done
fi
