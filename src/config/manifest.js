

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
            host: process.env.HOST,
            port: process.env.PORT
        }
    };

    return configuration[env][key];
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
            plugin:{
                register: 'inert',
            }
        },
        {
            plugin:{
                register: 'vision',
            }
        },
        {
            plugin: {
                register: './pg',
                options: {
                    development :{
                        "user": "postgres", 
                        "password": "postgres", 
                        "database": "ttrack", 
                        "port": "5432", 
                        "host": "postgres",
                        "driver": "pg", 
                        "schema": "public"
                    },
                    test:{
                        //connectionString: process.env.DATABASE_URL
                        "user": "postgres", 
                        "password": "postgres", 
                        "database": "ttrack_test", 
                        "port": "5432", 
                        "host": "postgres",
                        "driver": "pg", 
                        "schema": "public"
                    },
                    production: {
                        "user": "postgres", 
                        "password": "postgres", 
                        "database": "ttrack", 
                        "port": "5432", 
                        "host": "localhost",
                        "driver": "pg", 
                        "schema": "public"
                    }
                }
            }
        },
        {
            plugin: './api',
            options: { 
                routes: { prefix: '/api' } 
            }
        },
        {
            plugin: {
                register: 'hapi-405-routes',
                options: {
                    setAllowHeader: true,
                }
            }
        },
        {
            "plugin": {
                'register': 'hapi-swagger',
                'options': {
                    tags: [{
                        "name": "api",
                        "description": "Public user calls"
                    }],
                    "info": {
                        "description": "This is the ttrack API",
                        "version": "0.3.2",
                        "title": "ttrack API",
                        "contact": {
                            "email": "ts@25th-floor.com",
                        },
                        "license": {
                            "name": "MIT",
                            "url": "https://opensource.org/licenses/MIT"
                        }
                    },
                    documentationPath: '/docs',
                }   
            }
        },{
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
                            args: [{ format: 'DD.MM.YYYY hh:mm:ss' }],
                        }, 'stdout']
                    }
                }
            }
        }
    ]
};

module.exports = manifest;