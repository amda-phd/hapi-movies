const Glue = require('@hapi/glue');
const manifest = require('./manifest');
require('./db/mongoose');

const options = {
    relativeTo: __dirname
};

// init for tests
exports.init = async() => {
    const server = await Glue.compose(manifest, options);
    await server.initialize();

    return server;
}

// start for dev and run
exports.start = async () => {
    const server = await Glue.compose(manifest, options);
    await server.start();

    // Log responses
    server.events.on('response', function (request) {
        // you can use request.log or server.log its depends
        server.log(request.info.remoteAddress + ': ' + request.method.toUpperCase() + ' ' + request.url.path + ' --> ' + request.response.statusCode);
    });

    console.log('hAPI server started at: ', server.info.uri);
    return server;
}

// Show bad promises
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: ', p, ' reason: ', reason);
    process.exit(1);
});