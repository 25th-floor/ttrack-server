const appRoot = require('app-root-path');
const {
    version,
    ttrackServer
} = require(`${appRoot}/package.json`);

const envKey = key => {
    const env = process.env.NODE_ENV || 'development';
    const configuration = {
        development: {
            host: '0.0.0.0',
            port: process.env.PORT || 8000
        },
        test: {
            host: '0.0.0.0',
            port: 8001
        },
        // These should match environment variables on hosted server
        production: {
            host: process.env.HOST || '0.0.0.0',
            port: process.env.PORT || 8000
        }
    };

    return configuration[env][key];
};

const databaseConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'ttrack',
    port: process.env.DB_PORT || '5432',
    host: process.env.DB_HOST || 'postgres',
    driver: process.env.DB_DRIVER || 'pg',
    schema: process.env.DB_SCHEMA || 'public'
};

const manifest = {
    server: {
        host: envKey('host'),
        port: envKey('port'),
        debug: envKey('debug'),
        routes: {
            cors: {
                origin: ['*'],
            }
        },
        router: {
            stripTrailingSlash: true
        }
    },
    register: {
        plugins: [
            {
                plugin: require('inert'),
            },
            {
                plugin: require('vision'),
            },
            {
                plugin: './pg',
                options: {
                    development: {
                        ...databaseConfig,
                    },
                    test: {
                        ...databaseConfig,
                        'database': 'ttrack_test',
                    },
                    production: {
                        ...databaseConfig,
                    }
                }
            },
            {
                plugin: './api',
                routes: {
                    prefix: '/api'
                }
            },
            // {
            //     plugin: require('hapi-405-routes'),
            //     options: {
            //         methodsToSupport: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'TRACE'],
            //         setAllowHeader: true,
            //     }
            // },
            {
                plugin: require('hapi-swagger'),
                options: {
                    tags: [{
                        name: 'api',
                        description: 'Public user calls'
                    }],
                    info: {
                        description: 'This is the ttrack API',
                        version: version,
                        title: 'ttrack API',
                        contact: {
                            email: 'ts@25th-floor.com',
                        },
                        license: {
                            name: 'MIT',
                            url: 'https://opensource.org/licenses/MIT'
                        }
                    },
                    documentationPath: '/docs',
                }
            },
            {
                plugin: require('good'),
                options: {
                    reporters: {
                        console: [{
                            module: 'good-squeeze',
                            name: 'Squeeze',
                            args: [{
                                log: envKey('log'),
                                response: envKey('response'),
                                error: envKey('error'),
                                format: 'DD.MM.YYYY hh:mm:ss',
                            }]
                        }, {
                            module: 'good-console',
                            args: [{
                                format: 'DD.MM.YYYY hh:mm:ss'
                            }],
                        }, 'stdout']
                    }
                }
            },
            {
                plugin: require('hapi-api-version'),
                options: {
                    validVersions: ttrackServer.validVersions,
                    defaultVersion: ttrackServer.apiVersion,
                    vendorName: 'ttrack'
                }
            }
        ]
    }
};

module.exports = manifest;