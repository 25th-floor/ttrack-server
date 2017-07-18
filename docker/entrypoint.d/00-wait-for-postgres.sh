#!/usr/bin/env bash

NC=`which nc`
NC_HOST="postgres"
NC_PORT=5432
RETVAL=0

if [ "${NODE_ENV}" == "development" ]; then
	# Wait for MySQL on development docker compose setup
	echo "Waiting up to 40 seconds for PostgreSQL port [${NC_PORT}] to become available on host [${NC_HOST}]"
	for i in {1..40}; do
		nc -z ${NC_HOST} ${NC_PORT} 2>&1 >/dev/null
		RETVAL=$?

		if [[ ${RETVAL} -gt 0 ]]; then
			echo "  ... connection not possible - retry (${i})"
			sleep 1
		else
			echo "  ... TCP port [${NC_PORT}] is responding"
			break
		fi
	done
fi

exit ${RETVAL}
