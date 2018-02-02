const packageJson = require('../../package.json');

const envKey = key => {
    const env = process.env.NODE_ENV || 'development';

    const configuration = {
        development: {
            host: '0.0.0.0',
            port: process.env.PORT || 8000
        },
        test: {
            host: '0.0.0.0',
            port: process.env.PORT || 8001
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
    connections: [
        {
            host: envKey('host'),
            port: envKey('port'),
            routes: {
                cors: true
            },
            router: {
                stripTrailingSlash: true
            }
        }
    ],
    registrations: [
        {
            plugin: {
                register: 'inert',
            }
        },
        {
            plugin: {
                register: 'vision',
            }
        },
        {
            plugin: {
                register: './pg',
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
            }
        },
        {
            plugin: './api',
            options: {
                routes: {prefix: '/api'}
            }
        },
        {
            plugin: {
                register: 'hapi-405-routes',
                options: {
                    methodsToSupport: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'TRACE'],
                    setAllowHeader: true,
                }
            }
        },
        {
            plugin: {
                register: 'hapi-swagger',
                options: {
                    tags: [{
                        name: 'api',
                        description: 'Public user calls'
                    }],
                    info: {
                        description: 'This is the ttrack API',
                        version: packageJson.version,
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
            }
        },
        {
            plugin: {
                register: 'good',
                options: {
                    reporters: {
                        console: [{
                            module: 'good-squeeze',
                            name: 'Squeeze',
                            args: [{
                                log: '*',
                                response: '*',
                                error: '*',
                            }]
                        }, {
                            module: 'good-console',
                            args: [{format: 'DD.MM.YYYY hh:mm:ss'}],
                        }, 'stdout']
                    }
                }
            }
        },
        {
            plugin: {
                register: 'hapi-api-version',
                options: {
                    validVersions: packageJson.ttrackServer.validVersions,
                    defaultVersion: packageJson.ttrackServer.apiVersion,
                    vendorName: 'ttrack'
                }
            }
        }
    ]
};

module.exports = manifest;