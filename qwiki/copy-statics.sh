#!/bin/bash

OUTDIR=./dist
mkdir -p $OUTDIR
cp ./package.json $OUTDIR/package.json
cp -r ./src/resources/* $OUTDIR/
cp -r ./esm/register.js $OUTDIR/
cp -r ./esm/loader.js $OUTDIR/

(
cd src || exit 1
find . -regextype posix-extended -regex '.*\.(css|html)' -exec cp --parents {} ../$OUTDIR/ \;
)

