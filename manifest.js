const HapiSwagger = require('hapi-swagger');
const HapiPino = require('hapi-pino');
const Vision = require('@hapi/vision');
const Inert = require('@hapi/inert');

const swaggerOptions = {
    info: {
        title: 'hAPI movies',
        version: '1.0',
        description: 'Save movies to your personal database',
        contact: {
            name: 'amda',
            email: 'amda.prog@gmail.com'
        }
    },
    schemes: ['https']
};

module.exports = {
    server: {
        host: process.env.HAPI_HOST,
        port: process.env.HAPI_PORT
    },
    register: {
        plugins: [
            // Custom JSON Web Token Bearer plugin saved as plugin for simpler operation
            {
                plugin: './plugins/authWrapper'
            },
            // Documentation via Swagger
            {
                plugin: Inert
            },
            {
                plugin: Vision
            },
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            },
            // Pretty logs
            {
                plugin: HapiPino,
                options: {
                    prettyPrint: true, //config.nodeEnv !== 'production',
                    logEvents: 'error' //['response', 'onPostStart']
                }
            },
            // Routes
            {
                plugin: './routes/ping'
            },
            {
                plugin: './routes/user'
            },
            {
                plugin: './routes/movie'
            }
        ]
    }
}