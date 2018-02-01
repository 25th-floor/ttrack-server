#!/bin/bash
set -e
if [[ $NODE_ENV == "development" ]]; then
    echo "SETUP TEST DATABASE"
    echo "#"
    yarn run migration-test
fi