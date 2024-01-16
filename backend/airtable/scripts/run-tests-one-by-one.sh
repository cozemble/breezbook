#!/usr/bin/env bash

for i in `ls -1 test/*.spec.ts`; do
  echo "Running $i"
  npx vitest run $i
done