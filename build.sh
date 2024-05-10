#!/bin/bash

mkdir -p build

(
echo "Build server"
cd qwiki || exit 1
chmod +x ./build.sh
./build.sh
)

(
echo "Build web client"
cd qclient || exit 1
chmod +x ./build.sh
./build.sh
)