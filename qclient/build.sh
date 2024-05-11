#!/bin/bash

set -e

ID=dist #$(uuidgen)
COMPILE_OUTDIR="../build/tmp/$ID"
DIST_OUTDIR="../build/client"

rm -rf "$COMPILE_OUTDIR"
mkdir -p "$COMPILE_OUTDIR"
mkdir -p "$DIST_OUTDIR"

COMPILE_OUTDIR=$(realpath "$COMPILE_OUTDIR")
DIST_OUTDIR=$(realpath "$DIST_OUTDIR")

cat <<-EOF
Build Qlient
Compiler output dir     : $COMPILE_OUTDIR
Distribution output dir : $DIST_OUTDIR
EOF

echo "compile..."
npx tspc --outDir "$COMPILE_OUTDIR" # --listFiles

echo "install dependencies..."
(
cp -v ./package.json "$COMPILE_OUTDIR/package.json"
cd "$COMPILE_OUTDIR" || exit 1
npm install --only=production --omit=dev --silent
)

echo "pack..."
npx webpack --entry "$COMPILE_OUTDIR/main.js" --output-path "$DIST_OUTDIR" --config webpack.config.cjs

echo $DIST_OUTDIR
echo "copy static files..."
(
cd src || exit 1
find . -type f -regextype posix-extended  -not -regex '^.*\.ts$' -exec cp -v --parents {} "$DIST_OUTDIR/" \;
)

echo "...OK"
