#!/bin/bash

set -e
echo "Copy data"

DIST_OUTDIR=../build/server/data
mkdir -p "$DIST_OUTDIR"

npx sass ./
find . -type f -regextype posix-extended -not -regex '^.*\.scss$' -exec cp -v --parents {} "$DIST_OUTDIR/" \;

