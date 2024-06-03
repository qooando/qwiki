#!/bin/bash

set -e
echo "Copy data"

DIST_OUTDIR=../build/data
mkdir -p "$DIST_OUTDIR"

npx sass ./
find . -type f -regextype posix-extended \
  -not -regex '^.*\.(scss|sh|map)$' \
  -not -regex '^.*/node_modules/.*$' \
  -not -regex '^.*/package.json$' \
  -not -regex '^.*/package-lock.json$' \
  -exec cp -v --parents {} "$DIST_OUTDIR/" \;

