#!/bin/bash
set -e

if [ "$1" = 'ttrack-server' ]; then

	# Required parameters
	: "${DB_USER:?Must be set}"
	: "${DB_PASS:?Must be set}"
	: "${DB_DATABASE:?Must be set}"
	: "${DB_HOST:?Must be set}"

	# Optional parameters with postgres defaults
	: "${DB_PORT:=5432}"
	: "${DB_DRIVER:=pg}"
	: "${DB_SCHEMA:=public}"

	printf '{"sql-file" : true, "dev": {"user": "%s", "password": "%s", "database": "%s", "port": "%s", "host": "%s",
		"driver": "%s", "schema": "%s"}}\n' \
		"$DB_USER" "$DB_PASS" "$DB_DATABASE" "$DB_PORT" "$DB_HOST" "$DB_DRIVER" "$DB_SCHEMA" \
		> ./database.json

	# Wait for database server to show up
	while ! nc -z $DB_HOST $DB_PORT; do echo "Waiting for PgSQL"; sleep 1; done

	# Migrate database to latest version
	node_modules/.bin/db-migrate up

	# Hand over to the node server
	exec ./node_modules/.bin/babel-node ./src/server/index.js
fi

exec "$@"
