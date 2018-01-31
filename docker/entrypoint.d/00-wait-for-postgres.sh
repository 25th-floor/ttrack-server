#!/usr/bin/env bash

: "${DB_HOST:?Must be set}"
: "${DB_PORT:=5432}"

NC=`which nc`
NC_HOST=$DB_HOST
NC_PORT=$DB_PORT
RETVAL=0

# Wait for postgres on development docker compose setup
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

exit ${RETVAL}
