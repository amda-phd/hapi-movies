const { expect } = require('@hapi/code');
const Lab = require('@hapi/lab');
const { afterEach, beforeEach, describe, it } = exports.lab = Lab.script();
const { init } = require('../server');

const {
    userOne, userOneId,
    Movie,
    movieOne, movieOneId,
    movieTwo, movieTwoId,
    movieThree, movieThreeId,
    setUpDatabase
} = require('./fixtures/db');

beforeEach(setUpDatabase);

describe('Movie routes', () => {
    let server;

    beforeEach(async () => {
        server = await init();
    })

    afterEach(async () => {
        await server.stop();
    });

    // SUCCESS
    it('Should create a new movie when a user is logged in', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/movies',
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            },
            payload: {
                title: 'Barry Lyndon',
                genre: 'Drama'
            }
        });
        expect(res.statusCode).to.equal(201);
        expect(res.result.movie).to.be.an.instanceOf(Movie);

        const movie = await Movie.findOne({ title: 'Barry Lyndon' });
        expect(movie).not.to.be.null();
        expect(movie.creator).to.equal(userOneId);
    });

    it('Should edit a movie if the user is logged in and its id is known', async () => {
        const res = await server.inject({
            method: 'PATCH',
            url: `/movies/${movieThreeId}`,
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            },
            payload: {
                plot: 'Family reunion goes wrong'
            }
        });
        expect(res.statusCode).to.equal(200);
        expect(res.result.movie).to.be.an.instanceOf(Movie);

        const movie = await Movie.findById(movieThreeId);
        expect(movie).not.to.be.null();
        expect(movie).to.be.an.instanceOf(Movie);
        expect(movie.plot).not.to.equal(movieThreeId.plot);
        expect(movie.plot).to.equal('Family reunion goes wrong')
    });

    it('Should delete a movie when a user is logged in', async () => {
        const res = await server.inject({
            method: 'DELETE',
            url: `/movies/${movieTwoId}`,
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            }
        });
        expect(res.statusCode).to.equal(200);

        const movie = await Movie.findById(movieTwoId);
        expect(movie).to.be.null();
    });

    it('Should show the movies list to any user', async () => {
        let res = await server.inject({
            method: 'GET',
            url: '/movies'
        });
        expect(res.statusCode).to.equal(200);
        expect(res.result.movies.length).to.equal(3);

        res = await server.inject({
            method: 'GET',
            url: '/movies?name=alien'
        });
        expect(res.statusCode).to.equal(200);
        expect(res.result.movies.length).to.equal(1);
        expect(res.result.movies[0]._id).to.equal(movieOneId);

        res = await server.inject({
            method: 'GET',
            url: '/movies?genre=comedia'
        });
        expect(res.statusCode).to.equal(200);
        expect(res.result.movies.length).to.equal(1);
        expect(res.result.movies[0]._id).to.equal(movieTwoId);
        expect(res.result.movies[0].genre).to.equal('Comedia');

        res = await server.inject({
            method: 'GET',
            url: '/movies?genre=comedia&name=alien'
        });
        expect(res.statusCode).to.equal(204);
        expect(res.result).to.be.null();
        
        res = await server.inject({
            method: 'GET',
            url: '/movies?limit=2'
        });
        expect(res.statusCode).to.equal(200);
        expect(res.result.movies.length).to.equal(2);

        res = await server.inject({
            method: 'GET',
            url: '/movies?skip=1'
        });
        expect(res.statusCode).to.equal(200);
        expect(res.result.movies.length).to.equal(2);
        expect(res.result.movies[0]._id).to.equal(movieTwoId);
    });
    
    // FAILURE
    it('Should not create movies for non logged users', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/movies',
            payload: {
                title: 'Barry Lyndon',
                genre: 'Drama'
            }
        });
        expect(res.statusCode).to.equal(401);

        const movie = await Movie.findOne({ title: 'Barry Lyndon' });
        expect(movie).to.be.null();
    });

    it('Should not remove movies for non logged users', async () => {
        const res = await server.inject({
            method: 'DELETE',
            url: `/movies/${movieTwoId}`
        });
        expect(res.statusCode).to.equal(401);

        const movie = await Movie.findById(movieTwoId);
        expect(movie).not.to.be.null();
    })

    it('Should not create movies with incorrect data', async () => {
        const res = await server.inject({
            method: 'POST',
            url: '/movies',
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            },
            payload: {
                title: 'Excalibur',
                genre: 'Aventuras',
                plot: 'Post-roman brexit works in strange ways'
            }
        });
        expect(res.statusCode).to.equal(400);

        const movie = await Movie.findOne({ title: 'Excalibur' });
        expect(movie).to.be.null();
    });

    it('Should not create duplicated entries in the movies database', async() => {
        const res = await server.inject({
            method: 'POST',
            url: '/movies',
            headers: {
                'authorization': `Bearer ${userOne.tokens[0].token}`
            },
            payload: {
                title: movieTwo.title
            }
        });
        expect(res.statusCode).to.equal(400);
    })
});
