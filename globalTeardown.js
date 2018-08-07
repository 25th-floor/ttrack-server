module.exports = async function() { 
    console.log('try Shutdown server...');
    try {
        await process.Server.stop();
        console.log('Shutdown');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};