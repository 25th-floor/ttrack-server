module.exports = function (wallaby) {
    process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/ttrack_test';
    process.env.NODE_ENV = 'test';
    process.env.TZ = 'UTC';
    return {
        files: [
            'src/**/*.js',
            '!src/**/*.test.js',
        ],

        tests: ['src/**/*.test.js'],

        env: {
            type: 'node',
            runner: 'node',
        },

        compilers: {
            '**/*.js': wallaby.compilers.babel({
                babel: require('babel-core'),
                //presets: ['react-app'],
            }),
        }, 

        /*setup: function (w) {
            w.testFramework.configure({
               setupTestFrameworkScriptFile: '<rootDir>/setup-jasmine-env.js'
            });
        }, */

        delays: {
            run: 1000
        },
        
        testFramework: 'jest',
    };
};
