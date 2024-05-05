#!/bin/bash

OUTDIR=./dist
mkdir -p $OUTDIR
cp ./package.json $OUTDIR/package.json
cp -r ./src/resources/* $OUTDIR/
cp -r ./loader/register.js $OUTDIR/
cp -r ./loader/loader.js $OUTDIR/

(
cd src || exit 1
find . -regextype posix-extended -regex '.*\.(css|html)' -exec cp --parents {} ../$OUTDIR/ \;
find . -regextype posix-extended -regex '.*\.(png|jpg)' -exec cp --parents {} ../$OUTDIR/ \;
)

