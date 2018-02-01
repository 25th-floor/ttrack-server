#!/bin/bash
set -e
if [[ $NODE_ENV == "development" ]]; then
    echo "START SERVER in DEVELOPMENT"
    yarn start
else
    echo "START SERVER in PRODUCTION"
    yarn start:production
fi