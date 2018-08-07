require("babel-register");

const appRoot = require('app-root-path');
const { startServer } = require(`${appRoot}/src/startServer`);

module.exports = async function() {
    console.log('\nTry Start Server');
    try {
        await startServer();
        return null;
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};