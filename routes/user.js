const Boom = require('@hapi/boom');

const { UserInput, UserPatch} = require('../validators/user');
const User = require('../models/user');

const register = async (server, options) => {
    server.route([
        {
            method: 'POST',
            path: '/users',
            handler: async (request, h) => {
                const user = new User(request.payload);

                try {
                    await user.save();
                    const token = await user.generateAuthToken();
                    return h.response({ user, token }).code(201);
                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error);
                }
            },
            options: {
                auth: false,
                tags: ['api', 'user'],
                description: 'Create a new user and log them in',
                notes: 'This should be easy',
                validate: {
                    payload: UserInput
                }
            }
        }, {
            method: 'POST',
            path: '/users/login',
            handler: async (request, h) => {
                try {
                    const user = await User.findByCredentials(request.payload.name, request.payload.password);
                    const token = await user.generateAuthToken();
                    return h.response({ user, token }).code(200);
                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.notFound('User not found')
                }
            },
            options: {               
                auth: false,
                tags: ['api', 'user'],
                description: 'Log in once, get your token and enjoy our API',
                notes: 'Provide a valida username and password',
                validate: {
                    payload: UserInput
                }
            }  
        }, {
            method: 'POST',
            path: '/users/logout',
            handler: async (request, h) => {
                try {
                    request.auth.credentials.user.tokens = request.auth.credentials.user.tokens.filter(token => token.token !== request.auth.credentials.token);
                    await request.auth.credentials.user.save();
                    return h.response().code(200);
                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error)
                }
            },
            options: {
                tags: ['api', 'user'],
                description: 'Logout current session',
                notes: 'The current token will be deleted from the tokens array'
            }
        }, {
            method: 'POST',
            path: '/users/logoutAll',
            handler: async (request, h) => {
                try {
                    request.auth.credentials.user.tokens = [];
                    await request.auth.credentials.user.save();
                    return h.response().code(200);
                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error)
                }
            },
            options: {               
                tags: ['api', 'user'],
                description: 'Logout all opened sessions',
                notes: 'All the JSON web tokens will be deleted for this user. They will have to login again to get a new one.'               
            }
        }, {
            method: 'GET',
            path: '/users/me',
            handler: async (request, h) => {
                console.log(request.auth.credentials)
                const { user } = request.auth.credentials;
                return h.response({ user }).code(200)
            },
            options: {              
                tags: ['api', 'user'],
                description: 'Check your own user account',
                notes: 'You have to be logged in and you cannot check other users accounts'
            }
        }, {
            method: 'PATCH',
            path: '/users/me',
            handler: async (request, h) => {
                const { user } = request.auth.credentials;
                const checkUser = await User.findByCredentials(user.name, request.payload.oldPassword);
                if (!checkUser) throw Boom.unauthorized('You need to provide your previous password')

                try {
                    user.password = request.payload.newPassword;
                    await user.save();
                    return h.response({ user }).code(200)
                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error);
                }
            },
            options: {
                tags: ['api', 'user'],
                description: 'Change your password',
                notes: 'Even if you are logged in, you have to provide a valid old password',
                validate: {
                    payload: UserPatch
                }
            }
        }, {
            method: 'DELETE',
            path: '/users/me',
            handler: async (request, h) => {
                try {
                    await request.auth.credentials.user.remove();
                    return h.response({ user: request.auth.credentials.user }).code(200);
                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error);
                }
            },
            options: {               
                tags: ['api', 'user'],
                description: 'Delete your user account from our servers.',
                notes: 'What did we do wrong?'
            },
        }
    ])
};

exports.plugin = {
    register,
    name: 'User plugin',
    version: '1.0.0',
    once: true
};