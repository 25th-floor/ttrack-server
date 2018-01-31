#!/bin/bash
set -e

# Required parameters
: "${DB_USER:?Must be set}"
: "${DB_PASSWORD:?Must be set}"
: "${DB_DATABASE:?Must be set}"
: "${DB_HOST:?Must be set}"

# Optional parameters with postgres defaults
: "${DB_PORT:=5432}"
: "${DB_DRIVER:=pg}"
: "${DB_SCHEMA:=public}"


echo "SETUP DATABASE CONFIG FROM DOCKERFILE/ENV"
echo "#"
echo "${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}/${DB_SCHEMA}"
echo "#"
printf '{
	"sql-file" : true, 
	"dev": {
		"user": "%s", 
		"password": "%s", 
		"database": "%s", 
		"port": "%s", 
		"host": "%s",
		"driver": "%s", 
		"schema": "%s"
	},
	"test": {
		"user": "%s", 
		"password": "%s", 
		"database": "%s_test", 
		"port": "%s", 
		"host": "%s",
		"driver": "%s", 
		"schema": "%s"
	},
	"production": {
		"user": "%s",
		"password": "%s",
		"database": "%s",
		"port": "%s",
		"host": "%s",
		"driver": "%s",
		"schema": "%s"
	}
}\n' \
"$DB_USER" "$DB_PASSWORD" "$DB_DATABASE" "$DB_PORT" "$DB_HOST" "$DB_DRIVER" "$DB_SCHEMA" \
"$DB_USER" "$DB_PASSWORD" "$DB_DATABASE" "$DB_PORT" "$DB_HOST" "$DB_DRIVER" "$DB_SCHEMA" \
"$DB_USER" "$DB_PASSWORD" "$DB_DATABASE" "$DB_PORT" "$DB_HOST" "$DB_DRIVER" "$DB_SCHEMA" \
> ./database.json

yarn migration