#!/bin/bash

echo "Start qwiki"

OUTDIR=../build/client
mkdir -p "$OUTDIR"

npx tsc --listFiles # --traceResolution

(
cd src || exit 1
find . -type f -regextype posix-extended  -not -regex '^.*\.ts$' -exec cp -v --parents {} ../$OUTDIR/ \;
)

#(
#cd $OUTDIR || exit 1
#npm install --only=production --omit=dev
#)