#!/bin/bash
set -e
if [[ $NODE_ENV -eq "development" ]]; then
    echo "SETUP TEST DATABASE"
    echo "#"
    yarn run migration-test
fi