#!/bin/bash

(
cd build/server || exit
LOADER=./register.js
MAIN=./app.js

# debug
node --import "$LOADER" "$MAIN" --listen

# release
#node --import ./dist/register.js ./dist/app.js
)