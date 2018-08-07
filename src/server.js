'use strict';
const manifest = require('./config/manifest');
const options = { relativeTo: __dirname }; 
const {startServer} = require('./startServer');

if (!process.env.PRODUCTION) {
    manifest.register.plugins.push("blipp");
}

startServer(manifest, options);