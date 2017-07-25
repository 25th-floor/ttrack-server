

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
                        "database": "ttrack", 
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
            plugin: {
                register: 'good',
                options: {
                    ops: { interval: 60000 },
                    reporters: {
                        console: [
                            { module: 'good-squeeze', name: 'Squeeze', args: [{ error: '*' }] }, { module: 'good-console' }, 'stdout'
                        ]
                    }
                }
            }
        }  
    ]
};

module.exports = manifest;