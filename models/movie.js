const mongoose = require('mongoose');
const Joigoose = require('joigoose')(mongoose);
const Boom = require('@hapi/boom');
const fs = require('fs');

const { MovieInput } = require('../validators/movie');

// Convert the previously defined validator in a Mongoose Schema
const movieSchema = new mongoose.Schema(Joigoose.convert(MovieInput), { strict: false });
movieSchema.add({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    poster: { type: Buffer }
})
movieSchema.set('timestamps', true);

// MIDDLEWARE
movieSchema.pre('save', async function (next) {
    const movie = this;

    // Avoid duplicates
    if (movie.isNew) {
        const previousMovie = await Movie.findOne({ title: movie.title });
        if (previousMovie) throw Boom.badRequest(`The film '${movie.title}' already exists in our database.`)
    }

    next();
})

movieSchema.pre('remove', async function (next) {
    const movie = this;

    if (movie.poster) movie.removePoster();
    next();
})

// METHODS
movieSchema.methods.toJSON = function () {
    const movieObject = this.toObject();
    // No one wants to see ugly binary buffers, don't they?
    delete movieObject.poster

    return movieObject
};

movieSchema.methods.handlePosterUpload = function () {
    return new Promise((resolve, reject) => {
        fs.writeFile(`./posters/${this._id}.jpg`, this.poster, error => {
            if (error) reject(error)
            resolve({ message: 'Poster uploaded!' })
        })
    })
}

movieSchema.methods.removePoster = function () {
    return new Promise((resolve, reject) => {
        fs.unlink(`./posters/${this._id}.jpg`, error => {
            if (error) reject(error)
            resolve({ message: 'Poster removed!' })
        })
    })
}

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;