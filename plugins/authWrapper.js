const AuthBearer = require('hapi-auth-bearer-token');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const register = async (server, options) => {
    server.register(AuthBearer);
    server.auth.strategy('simple', 'bearer-access-token', {
        allowQueryToken: true,
        validate: async (request, token, h) => {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({
                _id: decoded._id,
                'tokens.token': token
            })
            if (!user) return { isValid: false, credentials: token }
            return { isValid: true, credentials: { user, token } }
        }
    }),
    server.auth.default('simple')
};

exports.plugin = {
    register,
    name: 'auth-wrapper',
    version: '1.0.0',
    once: true
};