const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { afterEach, beforeEach, before, describe, it } = exports.lab = Lab.script();
const { init } = require('../server');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const {
    User,
    userOne, userOneId,
    setUpDatabase
} = require('./fixtures/db');

beforeEach(setUpDatabase);

describe('User routes', () => {
    let server;

    beforeEach(async () => {
        server = await init();
    })

    afterEach(async () => {
        await server.stop();
    });

    // SUCCESS
    it('Should signup a correct new user', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/users',
            payload: {
                username: 'jomarch',
                password: 'b0000ks'
            }
        });
        expect(res.statusCode).to.equal(201);
        
        const user = await User.findById(res.result.user._id);
        expect(user).not.to.be.null();

        expect(res.result.user).to.be.an.instanceof(User);
    });

    it('Should login valid users', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/users/login',
            payload: {
                username: userOne.username,
                password: userOne.password
            }
        });
        expect(res.statusCode).to.equal(200);
        expect(res.result.user).to.be.an.instanceof(User);
        expect(res.result.token).not.to.be.null();
    });

    it('Should retrieve the user information', async () => {
        const res = await server.inject({
            method: 'GET',
            url: '/users/me',
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            }
        });
        expect(res.statusCode).to.equal(200);
        expect(res.result.user).to.be.an.instanceof(User);
        expect(res.result.user._id).to.equal(userOneId);
    });

    it('Should change the password when the previous one is provided', async () => {
        const res = await server.inject({
            method: 'PATCH',
            url: '/users/me',
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            },
            payload: {
                oldPassword: userOne.password,
                newPassword: 'MrDarcy'
            }
        });
        expect(res.statusCode).to.equal(200);
        expect(res.result.user).to.be.an.instanceof(User);
        
        const user = await User.findById(res.result.user._id);
        expect(await bcrypt.compare('MrDarcy', user.password)).to.be.true();
    });

    it('Should delete users from the database', async () => {
        const res = await server.inject({
            method: 'DELETE',
            url: '/users/me',
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            }
        });
        expect(res.statusCode).to.equal(200);
        expect(res.result.user).to.be.an.instanceof(User);
        const user = await User.findById(userOneId);
        expect(user).to.be.null();
    });

    it('Should logout correctly logged user', async () => {
        let res = await server.inject({
            method: 'POST',
            url: '/users/logout',
            headers: {
                'Authorization': `Bearer ${userOne.tokens[0].token}`
            }
        });
        expect(res.statusCode).to.equal(200);

        res = await server.inject({
            method: 'GET',
            url: '/users/me',
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            }
        });
        expect(res.statusCode).to.equal(401);
    });

    // FAILURE
    it('Should not sign up invalid users', async () => {
        let res = await server.inject({
            method: 'POST',
            url: '/users',
            payload: {
                name: 'JoMarch',
                password: 'b0000ks'
            }
        });
        expect(res.statusCode).to.equal(400);
        expect(res.result.user).to.be.undefined();

        let user = await User.findOne({ username: 'JoMarch' });
        expect(user).to.be.null();

        res = await server.inject({
            method: 'POST',
            url: '/users',
            payload: {
                username: 'JoMarch',
                password: 'password'
            }
        });
        expect(res.statusCode).to.equal(500);
        expect(res.result.user).to.be.undefined();

        user = await User.findOne({ username: 'JoMarch' });
        expect(user).to.be.null();

        res = await server.inject({
            method: 'POST',
            url: '/users',
            payload: {
                username: 'JoMarch',
                password: 'laurie123456'
            }
        });
        expect(res.statusCode).to.equal(500);
        expect(res.result.user).to.be.undefined();

        user = await User.findOne({ username: 'JoMarch' });
        expect(user).to.be.null();

        res = await server.inject({
            method: 'POST',
            url: '/users',
            payload: {
                username: 'JoMarch'
            }
        });
        expect(res.statusCode).to.equal(400);
        expect(res.result.user).to.be.undefined();

        user = await User.findOne({ username: 'JoMarch' });
        expect(user).to.be.null();
    });

    it('Should not create duplicated users', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/users',
            payload: {
                username: userOne.username,
                password: 'MrDarcy'
            }
        });
        expect(res.statusCode).to.equal(400);
        expect(res.result.user).to.be.undefined();
    });

    it('Should not login non-existenting users', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/users/login',
            payload: {
                username: 'MegMarch',
                password: 'brooke'
            }
        });
        expect(res.statusCode).to.equal(401);
        expect(res.result.user).to.be.undefined();
        expect(res.result.token).to.be.undefined();
    });  

    it('Should not login users under wrong passwords', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/users/login',
            payload: {
                username: userOne.username,
                password: 'MrDarcy'
            }
        });
        expect(res.statusCode).to.equal(401);
        expect(res.result.user).to.be.undefined();
        expect(res.result.token).to.be.undefined();
    });

    it('Should not login users without password', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/users/login',
            payload: {
                username: userOne.username
            }
        });
        expect(res.statusCode).to.equal(400);
        expect(res.result.user).to.be.undefined();
        expect(res.result.token).to.be.undefined();
    });

    it('Should not change the password without rightful login and the previous one', async () => {
        let res = await server.inject({
            method: 'PATCH',
            url: '/users/me',
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            },
            payload: {
                newPassword: 'MrDarcy'
            }
        });
        expect(res.statusCode).to.equal(400);

        let user = await User.findById(userOneId);
        expect(await bcrypt.compare('MrDarcy', user.password)).to.be.false();

        res = await server.inject({
            method: 'PATCH',
            url: '/users/me',
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            },
            payload: {
                oldPassword: 'officers',
                newPassword: 'MrDarcy'
            }
        });
        expect(res.statusCode).to.equal(401);

        user = await User.findById(userOneId);
        expect(await bcrypt.compare('MrDarcy', user.password)).to.be.false();

        res = await server.inject({
            method: 'PATCH',
            url: '/users/me',
            headers: {
                'authorization': `Bearer ${jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)}`
            },
            payload: {
                oldPassword: userOne.password,
                newPassword: 'MrDarcy'
            }
        });
        expect(res.statusCode).to.equal(401);

        user = await User.findById(userOneId);
        expect(await bcrypt.compare('MrDarcy', user.password)).to.be.false();

        res = await server.inject({
            method: 'PATCH',
            url: '/users/me',
            payload: {
                oldPassword: userOne.password,
                newPassword: 'MrDarcy'
            }
        });
        expect(res.statusCode).to.equal(401);

        user = await User.findById(userOneId);
        expect(await bcrypt.compare('MrDarcy', user.password)).to.be.false();
    });

    it('Should not delete users bearing invalid tokens', async () => {
        const res = await server.inject({
            method: 'DELETE',
            url: '/users/me',
            headers: {
                'authorization': `Bearer ${jwt.sign({ _id: userOneId }, process.env.JWT_SECRET)}`
            }
        });
        expect(res.statusCode).to.equal(401);

        const user = await User.findById(userOneId);
        expect(user).to.be.an.instanceof(User);
        expect(user._id).to.equal(userOneId)
    });
});