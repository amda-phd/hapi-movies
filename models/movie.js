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
    }
})
movieSchema.set('timestamps', true);

// METHODS
movieSchema.methods.toJSON = function () {
    const movieObject = this.toObject();
    // No one wants to see ugly binary buffers, don't they?
    delete movieObject.poster

    return movieObject
};

movieSchema.methods.handlePosterUpload = function () {
    return new Promise((resolve, reject) => {
        fs.writeFile('./posters/test.png', this.poster, error => {
            if (error) reject(error)
            resolve({ message: 'Poster uploaded!' })
        })
    })
}

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;