const Boom = require('@hapi/boom');

const register = async (server, options) => {
    server.route([
        {
            method: 'GET',
            path: '/ping',
            options: {
                handler: async (request, h) => {
                    return h.response({ ping: 'pong' }).code(200)
                },
                auth: false,
                tags: ['api'],
                description: 'Check server health without auth',
                notes: 'Empty'
            }

        }
    ])
};

exports.plugin = {
    register,
    name: 'Ping plugin',
    version: '1.0.0',
    once: true
};