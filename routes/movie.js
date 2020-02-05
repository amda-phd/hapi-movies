const Boom = require('@hapi/boom');
const fs = require('fs');

const { MovieInput, MovieIdInput, MovieQuery } = require('../validators/movie');
const Movie = require('../models/movie');

const register = async (server, options) => {
    server.route([
        {
            method: 'POST',
            path: '/movies',
            handler: async (request, h) => {
                const movie = new Movie({
                    ...request.payload,
                    creator: request.auth.credentials.user._id
                });

                try {
                    await movie.save();
                    const message = `The film '${movie.title}' has been added to our database. Now it's available for all our users. Thanks for your contribution. Keep enjoying hAPI-movies.`
                    return h.response({ message, movie }).code(201)
                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error);
                }
            },
            options: {
                tags: ['api', 'movie'],
                description: 'Adds a new movie to the general movies database',
                notes: 'The name is required. All the other fields are optional. Only authenticated users can use this route',
                validate: {
                    payload: MovieInput
                }
            }
        }, {
            method: 'DELETE',
            path: '/movies/{movie_id}',
            handler: async (request, h) => {
                const _id = request.params.movie_id;
                const movie = await Movie.findById(_id);
                if (!movie) throw Boom.notFound('Invalid movie id')

                try {
                    await movie.remove();
                    const message = `The movie '${movie.title}' has been deleted from our database. Remember that no one will be able to acces to it again. Keep enjoying hAPI-movies.`;
                    return h.response({ movie, message }).code(200)
                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error);
                }
            },
            options: {
                tags: ['api', 'movie'],
                description: 'Deletes a movie from the database',
                notes: 'Only authenticated users can use this route',
                validate: {
                    params: {
                        movie_id: MovieIdInput
                    }
                }
            }
        }, {
            method: 'PATCH',
            path: '/movies/{movie_id}',
            handler: async (request, h) => {
                const _id = request.params.movie_id;
                const movie = await Movie.findById(_id);
                if (!movie) throw Boom.notFound('Invalid movie id')

                // Attempt updates
                const updates = Object.keys(request.payload)
                updates.forEach(update => movie[update] = request.payload[update])

                try {
                    await movie.save();
                    const message = `The record for '${movie.title}' has been updated successfully. Thanks for improving our database.`;
                    return h.response({ movie, message })
                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error);
                }
            },
            options: {
                tags: ['api', 'movie'],
                description: 'Modify an existing movie. All the fields can be changed',
                notes: 'Only authenticated users can use this route',
                validate: {
                    params: {
                        movie_id: MovieIdInput
                    },
                    payload: MovieInput
                }
            }
        }, {
            method: 'GET',
            path: '/movies',
            handler: async (request, h) => {
                const { genre, letter, name, limit, skip } = request.query;
                let movies = await Movie.find({ });

                // Some super basic logic for the possible queries
                if (genre) movies = movies.filter(movie => genre.toLowerCase().includes(movie.genre.toLowerCase()));
                if (letter) movies = movies.filter(movie => movie.title[0].toLowerCase() === letter.toLowerCase());
                if (name) movies = movies.filter(movie => movie.title.toLowerCase().includes(name.toLowerCase()));
                if (skip) movies = movies.slice(skip);
                if (limit && limit <= movies.length) movies = movies.slice(0, limit);

                if (movies.length < 1) {
                    const message = `There are no movies matching your query`;
                    return h.response({ message }).code(204);
                }
                const message = `These are the movies you were looking for`;
                return h.response({ message, movies }).code(200);
            },
            options: {
                auth: false,
                tags: ['api', 'movie'],
                description: 'Check, order and filter all the movies in our database',
                notes: 'No login is required to access this route',
                validate: {
                    query: MovieQuery
                }
            }
        }, {
            method: 'POST',
            path: '/movies/{movie_id}/poster',
            handler: async (request, h) => {
                const _id = request.params.movie_id;
                const movie = await Movie.findById(_id);
                if (!movie) throw Boom.notFound('Invalid movie id')

                const { payload } = request;
                movie.poster = payload.file;

                try {
                    await movie.handlePosterUpload()
                    await movie.save();
                    const message = `Poster uploaded correctly. Use GET on this route to check it out.`;
                    return h.response({ message }).code(200);
                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error);
                }              
            },
            options: {
                tags: ['api', 'movie'],
                description: 'Upload the poster for an already created movie.',
                notes: 'Only logged users can add posters',
                payload: {
                    maxBytes: 250000,
                    defaultContentType: 'image/jpeg'
                },
                validate: {
                    params: {
                        movie_id: MovieIdInput
                    }
                }
            }
        }, {
            method: 'DELETE',
            path: '/movies/{movie_id}/poster',
            handler: async (request, h) => {
                const _id = request.params.movie_id;
                const movie = await Movie.findById(_id);
                if (!movie) throw Boom.notFound('Invalid movie id');

                try {
                    await movie.removePoster();
                    await movie.save();
                    const message = `Poster deleted correctly`;
                    return h.response({ message }).code(200);

                } catch (error) {
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error);
                }              
            },
            options: {
                tags: ['api', 'movie'],
                description: 'Delete a poster for an already created movie.',
                notes: 'Only logged users can manipulate posters',
                validate: {
                    params: {
                        movie_id: MovieIdInput
                    }
                }
            }
        }, {
            method: 'GET',
            path: '/movies/{movie_id}/poster',
            handler: async (request, h) => {
                const _id = request.params.movie_id;
                const movie = await Movie.findById(_id);
                if (!movie) throw Boom.notFound('Invalid movie id')

                try {
                    const posterPath = await movie.servePoster();
                    console.log(posterPath)
                    return h.file(posterPath);
                } catch (error) {
                    console.log(error)
                    if (Boom.isBoom(error)) return error;
                    throw Boom.internal(error);
                }            
                
            },
            options: {
                auth: false,
                tags: ['api', 'movie'],
                description: 'Check the poster for a given movie',
                notes: 'No logging required for this route',
            }
        }
    ])
};

exports.plugin = {
    register,
    name: 'Movie plugin',
    version: '1.0.0',
    once: true
};