#!/bin/bash

mkdir -p build

(
cd qwiki || exit 1
chmod +x ./build.sh
./build.sh
)

(
cd qclient || exit 1
chmod +x ./build.sh
./build.sh
)