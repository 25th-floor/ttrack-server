#!/bin/bash
set -e
echo "SETUP DATABASE CONFIG FROM DOCKERFILE/ENV"
echo "#"
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
	}
}\n' \
"$DB_USER" "$DB_PASSWORD" "$DB_DATABASE" "$DB_PORT" "$DB_HOST" "$DB_DRIVER" "$DB_SCHEMA" \
"$DB_USER" "$DB_PASSWORD" "$DB_DATABASE" "$DB_PORT" "$DB_HOST" "$DB_DRIVER" "$DB_SCHEMA" \
> ./database.json

yarn migration