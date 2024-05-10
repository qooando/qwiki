#!/bin/bash

OUTDIR=../build/server
mkdir -p "$OUTDIR"

npx tsc --listFiles
# --traceResolution

cp -v ./package.json $OUTDIR/package.json
cp -vr ./src/resources/* $OUTDIR/
cp -vr ./loader/register.js $OUTDIR/
cp -vr ./loader/loader.js $OUTDIR/

(
cd $OUTDIR || exit 1
npm install  --omit=dev --only=production --silent
)