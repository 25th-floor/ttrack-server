const { Pool } = require('pg');
// const R = require('ramda');
// const sqlFormatter = require("sql-formatter");

const env = process.env.NODE_ENV || 'development';
let config;
let pool;
let Server;
//let counter = 0;

function initializeConnection(server, next){
    if(process.env.DATABASE_URL){
        config = {
            connectionString: process.env.DATABASE_URL
        };
    }

    // log connection to log for debug purposes
    const connectionString = config.connectionString
        || `${config.driver}, ${config.user}:${config.password}@${config.host}:${config.port}/${config.database}/${config.schema}`;
    server.log(`✅  Database is Configured on ${connectionString}`);

    pool = new Pool(config);
    Server = server;
    pool.on('error', (err, client) => {
        console.error('Unexpected error on idle client', client, err);
        process.exit(-1);
    });
    next();
}

async function closeConnection(server, next){
    await pool.end();
    next();
}

async function query(SQL, args) {
    try {
        const result = await pool.query(SQL, args);
        return result;
    } catch (error) {
        Server.log(['error'],error);
        return error;
    }
}

exports.getClient = async function() {
    return await pool.connect();
};

exports.query = query;

exports.register = function(server, options, next) {
    config = options[env];
    server.ext('onPreStart', initializeConnection);
    server.ext('onPreStop', closeConnection);
    next();
};

exports.register.attributes = {
    name: 'test',
    version: '1.0.0'
};