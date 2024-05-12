#!/bin/bash

set -e
echo "Copy data"

OUTDIR=../build/server/data
mkdir -p "$OUTDIR"
cp -vr ./* $OUTDIR/