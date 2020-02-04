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

                    const message = `Hi, ${user.username}! Welcome to hAPI-movies. Your user has been created successfully. Your token for this sesssion is ${token}. Have a great time watching films with us!`
                    
                    return h.response({ user, token, message }).code(201);
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
                    const user = await User.findByCredentials(request.payload.username, request.payload.password);
                    const token = await user.generateAuthToken();
                    const message = `Hi, ${user.username}! It's great to see you back in hAPI-movies. Your token for this sesssion is ${token}. Have a great time watching films with us!`
                    return h.response({ user, token, message }).code(200);
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
                    const message = `Cheers, ${request.auth.credentials.user.username}! Come back soon.`
                    return h.response({ message }).code(200);
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
                    const message = `Cheers, ${request.auth.credentials.user.username}! All your previous tokens have been revoked. Don't forget to login the next time you want to use hAPI-movies. Come back soon.`
                    return h.response({ message }).code(200);
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
                const { user } = request.auth.credentials;
                const message = `This is you :)`
                return h.response({ user, message }).code(200)
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
                const checkUser = await User.findByCredentials(user.username, request.payload.oldPassword);
                if (!checkUser) throw Boom.unauthorized('You need to provide your previous password')

                try {
                    user.password = request.payload.newPassword;
                    
                    await user.save();
                    const message = `${user.username}, your new password has been saved successfully. Keep enjoying hAPI-movies.`
                    return h.response({ user, message }).code(200)
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
                    const message = `We're sorry to see you go, ${request.auth.credentials.user.username}. Never stop enjoying great cinema, even if you're not with us anymore.`
                    return h.response({ user: request.auth.credentials.user, message }).code(200);
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