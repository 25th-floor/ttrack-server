#
# is not used 
#
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE ttrack_test WITH TEMPLATE ttrack OWNER postgres; 
EOSQL